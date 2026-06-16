-- Foto/avatar do negócio no perfil do usuário.
-- Nullable: sem ela, o app mostra a inicial do nome.

ALTER TABLE users ADD COLUMN avatar_url text;
