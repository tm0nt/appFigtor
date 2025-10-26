-- Tabelas para sistema de sessões e anti-fraude
-- Execute este SQL no seu PostgreSQL

-- Tabela de sessões do usuário
CREATE TABLE IF NOT EXISTS "public"."UserSession" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "deviceId" uuid NOT NULL,
    "sessionToken" text NOT NULL,
    "expires" timestamptz NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "location" text,
    "lastActivity" timestamptz DEFAULT now() NOT NULL,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "revokedAt" timestamptz,
    "revokedBy" uuid,
    "revokedReason" text,
    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE CASCADE
);

-- Índices para UserSession
CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_sessionToken_key" ON public."UserSession" USING btree ("sessionToken");
CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON public."UserSession" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "UserSession_deviceId_idx" ON public."UserSession" USING btree ("deviceId");
CREATE INDEX IF NOT EXISTS "UserSession_expires_idx" ON public."UserSession" USING btree ("expires");
CREATE INDEX IF NOT EXISTS "UserSession_isActive_idx" ON public."UserSession" USING btree ("isActive");

-- Tabela de fingerprints de dispositivos para anti-fraude
CREATE TABLE IF NOT EXISTS "public"."DeviceFingerprint" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "fingerprint" text NOT NULL,
    "ipAddress" text NOT NULL,
    "userAgent" text NOT NULL,
    "screenResolution" text,
    "timezone" text,
    "language" text,
    "platform" text,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("id")
);

-- Índices para DeviceFingerprint
CREATE UNIQUE INDEX IF NOT EXISTS "DeviceFingerprint_fingerprint_key" ON public."DeviceFingerprint" USING btree ("fingerprint");
CREATE INDEX IF NOT EXISTS "DeviceFingerprint_ipAddress_idx" ON public."DeviceFingerprint" USING btree ("ipAddress");

-- Tabela de relação entre usuários e fingerprints
CREATE TABLE IF NOT EXISTS "public"."UserFingerprint" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "fingerprintId" uuid NOT NULL,
    "firstUsedAt" timestamptz DEFAULT now() NOT NULL,
    "lastUsedAt" timestamptz DEFAULT now() NOT NULL,
    "usageCount" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "UserFingerprint_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserFingerprint_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "public"."DeviceFingerprint"("id") ON DELETE CASCADE
);

-- Índices para UserFingerprint
CREATE UNIQUE INDEX IF NOT EXISTS "UserFingerprint_userId_fingerprintId_key" ON public."UserFingerprint" USING btree ("userId", "fingerprintId");
CREATE INDEX IF NOT EXISTS "UserFingerprint_userId_idx" ON public."UserFingerprint" USING btree ("userId");

-- Tabela de bloqueios por suspeita de fraude
CREATE TABLE IF NOT EXISTS "public"."FraudBlock" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "type" text NOT NULL, -- 'IP', 'FINGERPRINT', 'EMAIL_DOMAIN'
    "value" text NOT NULL,
    "reason" text NOT NULL,
    "blockedAt" timestamptz DEFAULT now() NOT NULL,
    "blockedBy" uuid,
    "expiresAt" timestamptz,
    "isActive" boolean DEFAULT true NOT NULL,
    CONSTRAINT "FraudBlock_pkey" PRIMARY KEY ("id")
);

-- Índices para FraudBlock
CREATE INDEX IF NOT EXISTS "FraudBlock_type_value_idx" ON public."FraudBlock" USING btree ("type", "value");
CREATE INDEX IF NOT EXISTS "FraudBlock_isActive_idx" ON public."FraudBlock" USING btree ("isActive");

-- Ajustar tabela Device para permitir upsert por usuário + deviceId
ALTER TABLE public."Device" DROP CONSTRAINT IF EXISTS "Device_user_device_unique";
ALTER TABLE public."Device" ADD CONSTRAINT "Device_user_device_unique" UNIQUE ("userId","deviceId");

-- Comentários para documentação
COMMENT ON TABLE public."UserSession" IS 'Sessões ativas dos usuários por dispositivo';
COMMENT ON TABLE public."DeviceFingerprint" IS 'Fingerprints únicos de dispositivos para detecção de fraude';
COMMENT ON TABLE public."UserFingerprint" IS 'Relação entre usuários e fingerprints de dispositivos';
COMMENT ON TABLE public."FraudBlock" IS 'Bloqueios automáticos por suspeita de fraude';