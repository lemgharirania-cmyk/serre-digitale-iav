# routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from database import get_db
from auth import verify_password, create_token, get_current_user, hash_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await db.fetchrow(
        "SELECT * FROM utilisateurs WHERE email=$1 AND actif=TRUE", form.username
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
        "token_type": "bearer",
        "user": {"id": user["id"], "nom": user["nom"], "email": user["email"], "role": user["role"]}
    }

@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return current_user

class PasswordChange(BaseModel):
    ancien_mdp: str
    nouveau_mdp: str

@router.put("/change-password")
async def change_password(data: PasswordChange, current_user=Depends(get_current_user), db=Depends(get_db)):
    if not verify_password(data.ancien_mdp, current_user["mot_de_passe"]):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    new_hash = hash_password(data.nouveau_mdp)
    await db.execute("UPDATE utilisateurs SET mot_de_passe=$1 WHERE id=$2", new_hash, current_user["id"])
    return {"message": "Mot de passe modifié avec succès"}
