CREATE TABLE public.extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_name TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extractions"
  ON public.extractions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extractions"
  ON public.extractions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extractions"
  ON public.extractions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_extractions_user_created ON public.extractions(user_id, created_at DESC);