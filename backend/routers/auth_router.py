# routers/auth_router.py
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from database import get_db
from auth import verify_password, create_token, get_current_user, hash_password
from email_service import (
    send_verification_email,
    generate_verification_code,
    get_code_expiry
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

INVITE_CODE_FALLBACK = os.getenv("INVITE_CODE", "IAVAdmin2024")


# ── Helper : lire le code d'invitation depuis la DB ──────────
async def get_invite_code(db) -> str:
    try:
        row = await db.fetchrow(
            "SELECT valeur FROM config WHERE cle='invite_code'"
        )
        return row["valeur"] if row else INVITE_CODE_FALLBACK
    except Exception:
        return INVITE_CODE_FALLBACK


# ── Schémas ──────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    user:         dict

class RegisterBody(BaseModel):
    first_name:  str
    last_name:   str
    unit:        str = "ALL"
    email:       str
    password:    str
    invite_code: str

class VerifyBody(BaseModel):
    email: str
    code:  str

class ResendBody(BaseModel):
    email: str

class PasswordChange(BaseModel):
    ancien_mdp:  str
    nouveau_mdp: str

class InviteCodeChange(BaseModel):
    nouveau_code: str


# ── POST /api/auth/login ─────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db=Depends(get_db)
):
    user = await db.fetchrow(
        "SELECT * FROM utilisateurs WHERE email=$1 AND actif=TRUE",
        form.username
    )
    if not user or not verify_password(form.password, user["mot_de_passe"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Vérifier si l'email est confirmé
    if not user.get("email_verifie", True):
        raise HTTPException(
            status_code=403,
            detail="Email non vérifié. Vérifiez votre boîte mail."
        )

    await db.execute(
        "UPDATE utilisateurs SET last_login=NOW() WHERE id=$1", user["id"]
    )
    token = create_token({"sub": str(user["id"]), "role": user["role"]})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":    user["id"],
            "nom":   user["nom"],
            "email": user["email"],
            "role":  user["role"],
            "unit":  user.get("unit", "ALL"),
        }
    }


# ── POST /api/auth/register ──────────────────────────────────
# Étape 1 : créer le compte + générer + envoyer le code
@router.post("/register")
async def register(body: RegisterBody, db=Depends(get_db)):

    # Vérifier le code d'invitation
    code_invite = await get_invite_code(db)
    if body.invite_code.strip() != code_invite:
        raise HTTPException(
            status_code=403,
            detail="Code d'invitation incorrect. Contactez un administrateur."
        )

    # Vérifier si email existe déjà et est actif + vérifié
    existing = await db.fetchrow(
        "SELECT id, actif, email_verifie FROM utilisateurs WHERE email=$1",
        body.email
    )
    if existing and existing["actif"] and existing.get("email_verifie"):
        raise HTTPException(
            status_code=409,
            detail="Un compte actif existe déjà avec cet email."
        )

    # Validation mot de passe
    if len(body.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins 6 caractères."
        )

    # Générer le code de vérification
    verif_code = generate_verification_code()
    expires_at = get_code_expiry()
    nom_complet = f"{body.first_name} {body.last_name}".strip()
    hashed      = hash_password(body.password)

    if existing:
        # Compte existe mais pas encore vérifié → mettre à jour
        await db.execute("""
            UPDATE utilisateurs
            SET nom=$1, mot_de_passe=$2, unit=$3,
                verification_code=$4, code_expires_at=$5,
                email_verifie=FALSE
            WHERE email=$6
        """, nom_complet, hashed, body.unit,
             verif_code, expires_at, body.email)
    else:
        # Nouveau compte — email_verifie = FALSE jusqu'à confirmation
        await db.execute("""
            INSERT INTO utilisateurs
              (nom, email, mot_de_passe, unit, role, actif,
               email_verifie, verification_code, code_expires_at)
            VALUES ($1, $2, $3, $4, 'admin', TRUE, FALSE, $5, $6)
        """, nom_complet, body.email, hashed, body.unit,
             verif_code, expires_at)

    # Envoyer le code par email
    sent = await send_verification_email(
        body.email, verif_code, body.first_name
    )

    return {
        "message":      "Compte créé. Vérifiez votre email pour le code.",
        "email":        body.email,
        "email_sent":   sent,
        # Si SMTP pas configuré, le code apparaît dans les logs Render
        "note": "Si vous ne recevez pas l'email, contactez l'admin."
    }


# ── POST /api/auth/verify-email ──────────────────────────────
# Étape 2 : vérifier le code saisi par l'utilisateur
@router.post("/verify-email")
async def verify_email(body: VerifyBody, db=Depends(get_db)):

    user = await db.fetchrow(
        """SELECT id, verification_code, code_expires_at, email_verifie
           FROM utilisateurs WHERE email=$1 AND actif=TRUE""",
        body.email
    )

    if not user:
        raise HTTPException(status_code=404, detail="Email non trouvé.")

    if user.get("email_verifie"):
        return {"message": "Email déjà vérifié. Vous pouvez vous connecter."}

    # Vérifier le code
    if user["verification_code"] != body.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Code incorrect. Vérifiez le code reçu par email."
        )

    # Vérifier l'expiration
    if user["code_expires_at"] and user["code_expires_at"] < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Code expiré. Cliquez sur 'Renvoyer le code'."
        )

    # Activer le compte
    await db.execute("""
        UPDATE utilisateurs
        SET email_verifie=TRUE,
            verification_code=NULL,
            code_expires_at=NULL
        WHERE id=$1
    """, user["id"])

    return {"message": "Email vérifié ! Vous pouvez maintenant vous connecter."}


# ── POST /api/auth/resend-code ───────────────────────────────
# Renvoyer un nouveau code si l'ancien a expiré
@router.post("/resend-code")
async def resend_code(body: ResendBody, db=Depends(get_db)):

    user = await db.fetchrow(
        "SELECT id, nom, email_verifie FROM utilisateurs WHERE email=$1 AND actif=TRUE",
        body.email
    )

    if not user:
        raise HTTPException(status_code=404, detail="Email non trouvé.")

    if user.get("email_verifie"):
        return {"message": "Email déjà vérifié."}

    # Générer un nouveau code
    new_code   = generate_verification_code()
    expires_at = get_code_expiry()

    await db.execute("""
        UPDATE utilisateurs
        SET verification_code=$1, code_expires_at=$2
        WHERE id=$3
    """, new_code, expires_at, user["id"])

    await send_verification_email(body.email, new_code, user["nom"])

    return {"message": "Nouveau code envoyé. Vérifiez votre email."}


# ── GET /api/auth/invite-code ────────────────────────────────
@router.get("/invite-code")
async def get_code(current_user=Depends(get_current_user), db=Depends(get_db)):
    code = await get_invite_code(db)
    return {"invite_code": code}


# ── PUT /api/auth/invite-code ────────────────────────────────
@router.put("/invite-code")
async def update_invite_code(
    data: InviteCodeChange,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if len(data.nouveau_code.strip()) < 6:
        raise HTTPException(
            status_code=400,
            detail="Le code doit contenir au moins 6 caractères."
        )
    await db.execute("""
        INSERT INTO config (cle, valeur, updated_at)
        VALUES ('invite_code', $1, NOW())
        ON CONFLICT (cle) DO UPDATE SET valeur=$1, updated_at=NOW()
    """, data.nouveau_code.strip())
    return {"message": "Code d'invitation mis à jour.", "nouveau_code": data.nouveau_code.strip()}


# ── GET /api/auth/me ─────────────────────────────────────────
@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return current_user


# ── PUT /api/auth/change-password ────────────────────────────
@router.put("/change-password")
async def change_password(
    data: PasswordChange,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not verify_password(data.ancien_mdp, current_user["mot_de_passe"]):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    new_hash = hash_password(data.nouveau_mdp)
    await db.execute(
        "UPDATE utilisateurs SET mot_de_passe=$1 WHERE id=$2",
        new_hash, current_user["id"]
    )
    return {"message": "Mot de passe modifié avec succès"}
