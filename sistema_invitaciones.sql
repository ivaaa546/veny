-- ====================================================================
-- SISTEMA DE CÓDIGOS DE INVITACIÓN
-- ====================================================================

-- 1. Crear tabla de códigos
CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean DEFAULT false,
    used_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    used_at timestamptz
);

-- 2. Función para VALIDAR el código ANTES de crear el usuario
CREATE OR REPLACE FUNCTION public.validate_invitation_code()
RETURNS TRIGGER AS $$
DECLARE
    invite_code text;
    code_record record;
BEGIN
    -- Obtener el código enviado desde el frontend (metadata)
    invite_code := new.raw_user_meta_data->>'invitation_code';

    -- Si no hay código, rechazar registro
    IF invite_code IS NULL OR invite_code = '' THEN
        RAISE EXCEPTION 'Se requiere un código de invitación para registrarse.';
    END IF;

    -- Buscar el código en la tabla
    SELECT * INTO code_record FROM public.invitation_codes WHERE code = invite_code;

    -- Validaciones
    IF code_record IS NULL THEN
        RAISE EXCEPTION 'Código de invitación inválido.';
    END IF;

    IF code_record.is_used THEN
        RAISE EXCEPTION 'Este código de invitación ya ha sido utilizado.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para MARCAR el código como USADO DESPUÉS de crear el usuario
CREATE OR REPLACE FUNCTION public.mark_code_as_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.invitation_codes
    SET is_used = true, 
        used_by = new.id,
        used_at = now()
    WHERE code = new.raw_user_meta_data->>'invitation_code';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Vincular los Triggers a la tabla de usuarios de Supabase (auth.users)
-- Primero eliminamos si ya existen para evitar errores al re-ejecutar
DROP TRIGGER IF EXISTS check_code_before_signup ON auth.users;
DROP TRIGGER IF EXISTS mark_code_after_signup ON auth.users;

CREATE TRIGGER check_code_before_signup
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.validate_invitation_code();

CREATE TRIGGER mark_code_after_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.mark_code_as_used();

-- 5. GENERAR 20 CÓDIGOS INICIALES
-- Genera códigos tipo "VENY-X9Y8"
INSERT INTO public.invitation_codes (code)
SELECT 'VENY-' || upper(substr(md5(random()::text), 1, 4))
FROM generate_series(1, 20)
ON CONFLICT DO NOTHING;

-- Habilitar RLS (solo admins pueden ver códigos, nadie público)
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Política: Nadie puede ver los códigos públicamente (seguridad por oscuridad + triggers)
-- Solo el service_role (backend) o triggers pueden acceder.
