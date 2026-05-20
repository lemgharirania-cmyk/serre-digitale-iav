# routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
from auth import verify_password, create_token, get_current_user, hash_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ── Schémas ──────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class RegisterBody(BaseModel):
    first_name: str
    last_name: str
    unit: str = "ALL"
    email: str
    password: str

class PasswordChange(BaseModel):
    ancien_mdp: str
    nouveau_mdp: str


# ── POST /api/auth/login ─────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
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
    # Vérifier si l'email existe déjà
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

    # Nom complet
    nom_complet = f"{body.first_name} {body.last_name}".strip()

    # Hash du mot de passe
    hashed = hash_password(body.password)

    # Insertion dans la base
    await db.execute("""
        INSERT INTO utilisateurs (nom, email, mot_de_passe, unit, role, actif)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (email) DO UPDATE
          SET nom=$1, mot_de_passe=$3, unit=$4, actif=TRUE
    """, nom_complet, body.email, hashed, body.unit, "admin")

    return {
        "message": "Compte créé avec succès.",
        "email":   body.email,
        "nom":     nom_complet,
        "unit":    body.unit
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
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    new_hash = hash_password(data.nouveau_mdp)
    await db.execute(
        "UPDATE utilisateurs SET mot_de_passe=$1 WHERE id=$2",
        new_hash, current_user["id"]
    )
    return {"message": "Mot de passe modifié avec succès"}
