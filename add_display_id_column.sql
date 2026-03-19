-- Add the 'display_id' column for the friendly reference number (e.g., #TNG-ABC12345)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS display_id TEXT;

-- (Optional) Make it searchable for quicker lookups
CREATE INDEX IF NOT EXISTS idx_orders_display_id ON public.orders(display_id);
