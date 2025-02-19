--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    service SMALLINT NOT NULL,
    service_id TEXT NULL
);

-- Create purchases table
create table
  public.purchases (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    expires_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    plan SMALLINT NOT NULL,
    purchase_id TEXT NULL
  ) tablespace pg_default;


CREATE INDEX idx_customers_company_id ON public.customers(company_id);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_purchases_company_id ON public.purchases(company_id);
CREATE INDEX idx_purchases_customer_id ON public.purchases(customer_id);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;