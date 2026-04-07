import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbsenfdbalohrdtoknbv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZic2VuZmRiYWxvaHJkdG9rbmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzQ0OTAsImV4cCI6MjA5MTE1MDQ5MH0._QRgH9HC_ZH4Bmo7u68vZ2ryHiwt2fIhIDWbueOjsrA'

export const supabase = createClient(supabaseUrl, supabaseKey)