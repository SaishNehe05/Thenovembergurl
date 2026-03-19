-- 1. Create the 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'paid',
    razorpay_payment_id TEXT UNIQUE NOT NULL
);

-- 2. Create the 'order_items' table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    image_url TEXT,
    -- Add extra fields for legacy support if needed
    book_id TEXT,
    price_at_purchase NUMERIC
);

-- 3. Enable RLS (Row Level Security) - Optional but recommended
-- Allow anyone to insert, but only authenticated users to view
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous inserts
CREATE POLICY "Allow anonymous inserts to orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts to order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- 4. Set up Realtime (Optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
