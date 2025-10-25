-- Adminer 5.4.1 PostgreSQL 16.10 dump

CREATE TABLE "public"."Address" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid,
    "label" text,
    "line1" text NOT NULL,
    "line2" text,
    "city" text NOT NULL,
    "state" text NOT NULL,
    "postalCode" text NOT NULL,
    "country" text DEFAULT 'BR' NOT NULL,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    "number" text,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX "Address_user_city_state_idx" ON public."Address" USING btree ("userId", city, state);

TRUNCATE "Address";

CREATE TABLE "public"."Admin" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password" text NOT NULL,
    "name" character varying(255) NOT NULL,
    "avatar" text,
    "role" character varying(50) DEFAULT 'ADMIN',
    "isActive" boolean DEFAULT true,
    "lastLoginAt" timestamptz,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now(),
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

COMMENT ON TABLE "public"."Admin" IS 'Tabela de administradores do sistema';

COMMENT ON COLUMN "public"."Admin"."email" IS 'Email único do admin';

COMMENT ON COLUMN "public"."Admin"."password" IS 'Senha hash do admin (bcrypt)';

COMMENT ON COLUMN "public"."Admin"."role" IS 'Papel do admin: ADMIN, SUPER_ADMIN, MODERATOR';

COMMENT ON COLUMN "public"."Admin"."isActive" IS 'Se o admin está ativo ou bloqueado';

COMMENT ON COLUMN "public"."Admin"."lastLoginAt" IS 'Data/hora do último login';

CREATE UNIQUE INDEX "Admin_email_key" ON public."Admin" USING btree (email);

CREATE INDEX "Admin_email_idx" ON public."Admin" USING btree (email);

CREATE INDEX "Admin_isActive_idx" ON public."Admin" USING btree ("isActive");

CREATE INDEX "Admin_role_idx" ON public."Admin" USING btree (role);

TRUNCATE "Admin";
INSERT INTO "Admin" ("id", "email", "password", "name", "avatar", "role", "isActive", "lastLoginAt", "createdAt", "updatedAt") VALUES
('9550bd80-a8d4-4ba1-ae12-975d07c73649',	'admin@figtor.com.br',	'$2b$10$uf5YryGHgziwnlP3tD0hyeO2WYlw0OVZ7h7DRHdfuq5nAK7vbz66O',	'Administrador',	NULL,	'SUPER_ADMIN',	'1',	'2025-10-25 03:43:58.013704+00',	'2025-10-24 23:42:39.036001+00',	'2025-10-25 03:43:58.013704+00');

CREATE TABLE "public"."ConversionItem" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "jobId" uuid NOT NULL,
    "pageId" uuid NOT NULL,
    "status" "ConversionStatus" DEFAULT QUEUED NOT NULL,
    "error" text,
    "startedAt" timestamptz,
    "completedAt" timestamptz,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "ConversionItem_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "ConversionItem_unique_job_page" ON public."ConversionItem" USING btree ("jobId", "pageId");

CREATE INDEX "ConversionItem_job_status_idx" ON public."ConversionItem" USING btree ("jobId", status);

TRUNCATE "ConversionItem";

CREATE TABLE "public"."ConversionJob" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "subscriptionId" uuid,
    "projectId" uuid NOT NULL,
    "status" "ConversionStatus" DEFAULT QUEUED NOT NULL,
    "totalPages" integer NOT NULL,
    "pagesConverted" integer DEFAULT '0' NOT NULL,
    "startedAt" timestamptz,
    "completedAt" timestamptz,
    "metadata" jsonb,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "ConversionJob_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX "ConversionJob_user_created_idx" ON public."ConversionJob" USING btree ("userId", "createdAt");

CREATE INDEX "ConversionJob_subscription_status_idx" ON public."ConversionJob" USING btree ("subscriptionId", status);

TRUNCATE "ConversionJob";

CREATE TABLE "public"."Device" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "deviceId" text NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "userAgent" text,
    "ip" text,
    "appVersion" text,
    "lastSeenAt" timestamptz,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "Device_unique_user_device" ON public."Device" USING btree ("userId", "deviceId");

CREATE INDEX "Device_platform_idx" ON public."Device" USING btree (platform);

TRUNCATE "Device";

CREATE TABLE "public"."ElementorExport" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "itemId" uuid NOT NULL,
    "version" text,
    "data" jsonb NOT NULL,
    "sizeKB" integer,
    "hash" text,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "ElementorExport_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "ElementorExport_itemId_key" ON public."ElementorExport" USING btree ("itemId");

TRUNCATE "ElementorExport";

CREATE TABLE "public"."FeatureFlag" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "key" text NOT NULL,
    "description" text,
    "enabled" boolean DEFAULT false NOT NULL,
    "rolloutPercentage" integer,
    "metadata" jsonb,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "FeatureFlag_key_key" ON public."FeatureFlag" USING btree (key);

TRUNCATE "FeatureFlag";

CREATE TABLE "public"."Feedback" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "message" text NOT NULL,
    "rating" integer,
    "url" text,
    "status" text,
    "metadata" jsonb,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX "Feedback_type_created_idx" ON public."Feedback" USING btree (type, "createdAt");

CREATE INDEX "Feedback_userId_idx" ON public."Feedback" USING btree ("userId");

CREATE INDEX "Feedback_createdAt_idx" ON public."Feedback" USING btree ("createdAt" DESC);

TRUNCATE "Feedback";

CREATE TABLE "public"."FigmaPage" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "projectId" uuid NOT NULL,
    "figmaPageId" text NOT NULL,
    "name" text NOT NULL,
    "pageIndex" integer NOT NULL,
    "nodeCount" integer,
    "previewUrl" text,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "FigmaPage_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "FigmaPage_unique_by_project_page" ON public."FigmaPage" USING btree ("projectId", "figmaPageId");

CREATE INDEX "FigmaPage_project_pageIndex_idx" ON public."FigmaPage" USING btree ("projectId", "pageIndex");

TRUNCATE "FigmaPage";

CREATE TABLE "public"."FigmaProject" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "fileKey" text NOT NULL,
    "name" text,
    "fileUrl" text,
    "version" text,
    "lastSyncedAt" timestamptz,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "FigmaProject_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "FigmaProject_user_fileKey_unique" ON public."FigmaProject" USING btree ("userId", "fileKey");

CREATE INDEX "FigmaProject_user_created_idx" ON public."FigmaProject" USING btree ("userId", "createdAt");

TRUNCATE "FigmaProject";

CREATE TABLE "public"."Notification" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" text NOT NULL,
    "body" text NOT NULL,
    "data" jsonb,
    "readAt" timestamptz,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX "Notification_user_read_idx" ON public."Notification" USING btree ("userId", "readAt");

CREATE INDEX "Notification_channel_created_idx" ON public."Notification" USING btree (channel, "createdAt");

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt" DESC);

TRUNCATE "Notification";

CREATE TABLE "public"."Payment" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "subscriptionId" uuid,
    "provider" text NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" DEFAULT PENDING NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'BRL' NOT NULL,
    "description" text,
    "externalId" text,
    "externalRef" text,
    "pixPayload" text,
    "pixQrCode" text,
    "pixExpiresAt" timestamptz,
    "pixPayerAccount" text,
    "cardId" uuid,
    "authorizedAt" timestamptz,
    "paidAt" timestamptz,
    "refundedAt" timestamptz,
    "canceledAt" timestamptz,
    "feeAmount" numeric(12,2),
    "metadata" jsonb,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX "Payment_user_created_idx" ON public."Payment" USING btree ("userId", "createdAt");

CREATE INDEX "Payment_subscription_status_idx" ON public."Payment" USING btree ("subscriptionId", status);

CREATE INDEX "Payment_method_status_idx" ON public."Payment" USING btree (method, status);

TRUNCATE "Payment";

CREATE TABLE "public"."PaymentCard" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "provider" text NOT NULL,
    "token" text NOT NULL,
    "brand" text NOT NULL,
    "last4" character varying(4) NOT NULL,
    "expMonth" integer NOT NULL,
    "expYear" integer NOT NULL,
    "holderName" text,
    "fingerprint" text,
    "billingAddressId" uuid,
    "isDefault" boolean DEFAULT false NOT NULL,
    "status" text,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "PaymentCard_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "PaymentCard_token_key" ON public."PaymentCard" USING btree (token);

CREATE INDEX "PaymentCard_user_default_idx" ON public."PaymentCard" USING btree ("userId", "isDefault");

CREATE UNIQUE INDEX paymentcard_one_default_per_user ON public."PaymentCard" USING btree ("userId") WHERE ("isDefault" = true);

TRUNCATE "PaymentCard";

CREATE TABLE "public"."Plan" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" "PlanName" NOT NULL,
    "displayName" text NOT NULL,
    "pagesLimitPerMonth" integer,
    "isUnlimited" boolean DEFAULT false NOT NULL,
    "priceAmount" numeric(12,2),
    "currency" character varying(3) DEFAULT 'BRL' NOT NULL,
    "features" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "Plan_name_key" ON public."Plan" USING btree (name);

CREATE INDEX "Plan_isActive_idx" ON public."Plan" USING btree ("isActive");

TRUNCATE "Plan";
INSERT INTO "Plan" ("id", "name", "displayName", "pagesLimitPerMonth", "isUnlimited", "priceAmount", "currency", "features", "isActive", "createdAt", "updatedAt") VALUES
('15751db1-0b32-4ce6-86af-6efe629542f8',	'FREE',	'Gratuito',	5,	'0',	0.00,	'BRL',	NULL,	'1',	'2025-10-24 19:08:33.22102+00',	'2025-10-24 19:08:33.22102+00'),
('6919fdf4-4b8f-40f6-a0c0-cd22f1ef64b1',	'ELITE',	'Elite',	50,	'0',	69.99,	'BRL',	NULL,	'1',	'2025-10-24 19:08:33.22102+00',	'2025-10-24 19:08:33.22102+00'),
('a4f2c605-73b7-41d2-a4ff-ab8d27950ae8',	'UNLIMITED',	'Ilimitado',	NULL,	'1',	99.99,	'BRL',	NULL,	'1',	'2025-10-24 19:08:33.22102+00',	'2025-10-24 19:08:33.22102+00');

CREATE TABLE "public"."Subscription" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "planId" uuid NOT NULL,
    "status" "SubscriptionStatus" DEFAULT ACTIVE NOT NULL,
    "isCurrent" boolean DEFAULT false NOT NULL,
    "startedAt" timestamptz DEFAULT now() NOT NULL,
    "currentPeriodStart" timestamptz NOT NULL,
    "currentPeriodEnd" timestamptz NOT NULL,
    "cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
    "canceledAt" timestamptz,
    "externalId" text,
    "defaultPaymentMethodId" uuid,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX "Subscription_user_status_idx" ON public."Subscription" USING btree ("userId", status);

CREATE UNIQUE INDEX subscription_one_current_per_user ON public."Subscription" USING btree ("userId") WHERE ("isCurrent" = true);

TRUNCATE "Subscription";

CREATE TABLE "public"."SystemConfig" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "group" text,
    "key" text NOT NULL,
    "value" jsonb NOT NULL,
    "description" text,
    "updatedById" uuid,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "SystemConfig_key_key" ON public."SystemConfig" USING btree (key);

CREATE INDEX "SystemConfig_group_idx" ON public."SystemConfig" USING btree ("group");

TRUNCATE "SystemConfig";

CREATE TABLE "public"."UsagePeriod" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "subscriptionId" uuid NOT NULL,
    "periodStart" timestamptz NOT NULL,
    "periodEnd" timestamptz NOT NULL,
    "pagesUsed" integer DEFAULT '0' NOT NULL,
    "conversions" integer DEFAULT '0' NOT NULL,
    "meta" jsonb,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "UsagePeriod_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "UsagePeriod_unique_period" ON public."UsagePeriod" USING btree ("subscriptionId", "periodStart", "periodEnd");

CREATE INDEX "UsagePeriod_periodEnd_idx" ON public."UsagePeriod" USING btree ("periodEnd");

TRUNCATE "UsagePeriod";

CREATE TABLE "public"."User" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "passwordHash" text,
    "name" text,
    "currentSubscriptionId" uuid,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    "company" text,
    "phone" text,
    "hasUsedFreePlan" boolean DEFAULT false,
    "resetToken" text,
    "resetTokenExpiry" timestamptz,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);

CREATE UNIQUE INDEX "User_currentSubscriptionId_key" ON public."User" USING btree ("currentSubscriptionId");

CREATE INDEX "User_name_email_idx" ON public."User" USING btree (name, email);

CREATE INDEX "User_resetToken_idx" ON public."User" USING btree ("resetToken");

TRUNCATE "User";
INSERT INTO "User" ("id", "email", "passwordHash", "name", "currentSubscriptionId", "createdAt", "updatedAt", "company", "phone", "hasUsedFreePlan", "resetToken", "resetTokenExpiry") VALUES
('2a37d29c-2ae8-4c35-91bb-e55c8171eaf3',	'tassio1@gmail.com',	'$2b$12$GmPq8IBGU5uF1KHNm6JofOpI3RNizfOWHPXmplN5mx4y.sw3QA.q.',	'Tassio Montenegro',	NULL,	'2025-10-24 19:11:31.056184+00',	'2025-10-24 19:11:31.056184+00',	NULL,	NULL,	'0',	NULL,	NULL),
('9b2b584f-4b34-434f-ae4d-133658138988',	'tassiom067@gmail.com',	'$2b$12$BIH8m5GPpppYRY/BLmvHZuPlIQKj6CwEQ/Z4mw0Xn7xibZEzQjLZy',	'Tassio Montenegro',	NULL,	'2025-10-24 20:01:35.034407+00',	'2025-10-24 20:11:23.344393+00',	NULL,	NULL,	'0',	'ff48e63ad27a0d4aee5759e3ac92412d66664f539fb147d11da18cccbbca9350',	'2025-10-24 21:11:23.343+00'),
('21647786-b0b7-409c-b7c7-759168878d7c',	'tassiomontenegro14@gmail.com',	NULL,	'Tassio Montenegro',	NULL,	'2025-10-24 20:15:57.247442+00',	'2025-10-25 02:42:16.573234+00',	NULL,	NULL,	'0',	NULL,	NULL);

CREATE TABLE "public"."UserProfile" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "personType" "PersonType" NOT NULL,
    "cpf" character varying(14),
    "cnpj" character varying(18),
    "companyName" text,
    "stateReg" text,
    "birthDate" timestamptz,
    "phone" text,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX "UserProfile_userId_key" ON public."UserProfile" USING btree ("userId");

CREATE UNIQUE INDEX "UserProfile_cpf_key" ON public."UserProfile" USING btree (cpf);

CREATE UNIQUE INDEX "UserProfile_cnpj_key" ON public."UserProfile" USING btree (cnpj);

TRUNCATE "UserProfile";

ALTER TABLE ONLY "public"."Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."ConversionItem" ADD CONSTRAINT "ConversionItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ConversionJob"(id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."ConversionItem" ADD CONSTRAINT "ConversionItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "FigmaPage"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."ConversionJob" ADD CONSTRAINT "ConversionJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "FigmaProject"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."ConversionJob" ADD CONSTRAINT "ConversionJob_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."ConversionJob" ADD CONSTRAINT "ConversionJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."ElementorExport" ADD CONSTRAINT "ElementorExport_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ConversionItem"(id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."FigmaPage" ADD CONSTRAINT "FigmaPage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "FigmaProject"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."FigmaProject" ADD CONSTRAINT "FigmaProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."Payment" ADD CONSTRAINT "Payment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "PaymentCard"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."PaymentCard" ADD CONSTRAINT "PaymentCard_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."PaymentCard" ADD CONSTRAINT "PaymentCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."Subscription" ADD CONSTRAINT "Subscription_defaultPaymentMethodId_fkey" FOREIGN KEY ("defaultPaymentMethodId") REFERENCES "PaymentCard"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."SystemConfig" ADD CONSTRAINT "SystemConfig_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."UsagePeriod" ADD CONSTRAINT "UsagePeriod_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."User" ADD CONSTRAINT "User_currentSubscriptionId_fkey" FOREIGN KEY ("currentSubscriptionId") REFERENCES "Subscription"(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT DEFERRABLE;

-- 2025-10-25 04:05:55 UTC
