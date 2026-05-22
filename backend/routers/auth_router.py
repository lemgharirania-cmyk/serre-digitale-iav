# routers/auth_router.py
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from database import get_db
from auth import verify_password, create_token, get_current_user, hash_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Fallback si la table config n'existe pas encore
INVITE_CODE_FALLBACK = os.getenv("INVITE_CODE", "IAVAdmin2024")


# ── Helper : lire le code depuis la DB ───────────────────────
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
@router.post("/register")
async def register(body: RegisterBody, db=Depends(get_db)):

    # Vérifier le code d'invitation depuis la DB
    code_actuel = await get_invite_code(db)
    if body.invite_code.strip() != code_actuel:
        raise HTTPException(
            status_code=403,
            detail="Code d'invitation incorrect. Contactez un administrateur."
        )

    # Vérifier si email existe déjà
    existing = await db.fetchrow(
        "SELECT id, actif FROM utilisateurs WHERE email=$1", body.email
    )
    if existing and existing["actif"]:
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

    # Création du compte
    nom_complet = f"{body.first_name} {body.last_name}".strip()
    hashed      = hash_password(body.password)

    await db.execute("""
        INSERT INTO utilisateurs (nom, email, mot_de_passe, unit, role, actif)
        VALUES ($1, $2, $3, $4, 'admin', TRUE)
        ON CONFLICT (email) DO UPDATE
          SET nom=$1, mot_de_passe=$3, unit=$4, actif=TRUE
    """, nom_complet, body.email, hashed, body.unit)

    return {
        "message": "Compte créé avec succès.",
        "email":   body.email,
        "nom":     nom_complet,
        "unit":    body.unit
    }


# ── GET /api/auth/invite-code ────────────────────────────────
# Permet aux admins de voir le code actuel depuis le dashboard
@router.get("/invite-code")
async def get_code(
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    code = await get_invite_code(db)
    return {"invite_code": code}


# ── PUT /api/auth/invite-code ────────────────────────────────
# Permet aux admins de changer le code depuis le dashboard
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
        ON CONFLICT (cle) DO UPDATE
          SET valeur=$1, updated_at=NOW()
    """, data.nouveau_code.strip())

    return {
        "message":      "Code d'invitation mis à jour avec succès.",
        "nouveau_code": data.nouveau_code.strip()
    }


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
        raise HTTPException(
            status_code=400,
            detail="Ancien mot de passe incorrect"
        )
    new_hash = hash_password(data.nouveau_mdp)
    await db.execute(
        "UPDATE utilisateurs SET mot_de_passe=$1 WHERE id=$2",
        new_hash, current_user["id"]
    )
    return {"message": "Mot de passe modifié avec succès"}
