INSERT INTO "public"."profiles" ("id", "updated_at", "username", "full_name", "last_name", "first_name", "avatar_url", "email", "type", "is_superuser", "credits") VALUES ('1f4f7015-6f1e-4433-88f5-85f279b874d3', '2025-02-17 06:10:33.109753+00', 'hidenariyuda@gmail.com', 'Hidenari Yuda', null, null, 'https://lh3.googleusercontent.com/a/ACg8ocJT98SFP__Dyz7rCd8FDFoaV993AY3nEBRmZnfdU69ZbzgwLQ=s96-c', 'hidenariyuda@gmail.com', '0', 'false', '20');

INSERT INTO "public"."providers" ("id", "created_at", "updated_at", "deleted_at", "user_id", "type", "status", "account_id", "public_identifier", "first_name", "last_name", "email") VALUES ('855f2e02-d127-4568-b0e1-d6eba227e58a', '2025-02-17 06:24:48.066528+00', '2025-02-18 10:18:33.822018+00', null, '855f2e02-d127-4568-b0e1-d6eba227e58b', '0', '0', '8DE6lwCWQL6Ee8dSVxqcrw', 'hidenari-yuda', '英也', '湯田',  'hidenariyuda@gmail.com');


--
-- Name: workflow_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_histories (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    workflow_id UUID NOT NULL,
    offset SMALLINT NOT NULL DEFAULT 0,
    usage SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE public.clients (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    user_id UUID NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0,
    invited_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL
)

CREATE TABLE public.chat_groups (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    user_id UUID NOT NULL,
    client_id UUID[] NOT NULL
)

CREATE TABLE public.chats (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    from UUID NOT NULL,
    message TEXT
)