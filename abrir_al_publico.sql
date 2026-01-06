-- ====================================================================
-- SCRIPT PARA ABRIR LA PLATAFORMA AL PÚBLICO
-- ====================================================================
-- Ejecuta esto en el SQL Editor de Supabase cuando quieras quitar
-- la restricción de los códigos de invitación.

-- 1. Eliminar el trigger que bloquea el registro sin código
DROP TRIGGER IF EXISTS check_code_before_signup ON auth.users;

-- 2. Eliminar el trigger que marca códigos como usados (ya no es necesario)
DROP TRIGGER IF EXISTS mark_code_after_signup ON auth.users;

-- ¡LISTO! Ahora cualquiera podrá registrarse sin código.
