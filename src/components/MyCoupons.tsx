// src/components/MyCoupons.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path as necessary
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext'; // <-- IMPORT HOOK

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  description: string;
  is_active: boolean;
  used_count: number;
  usage_limit: number;
}

const MyCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage(); // <-- USE HOOK

  useEffect(() => {
    const fetchCoupons = async () => {
      // RLS ensures we only fetch coupons belonging to the logged-in user
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching coupons:", error);
      } else {
        setCoupons(data || []);
      }
      setLoading(false);
    };

    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code) // Use browser API to copy
      .then(() => {
        // Show success toast
        toast({
          title: t.coupons_copied_title,
          description: t.coupons_copied_desc.replace('{code}', code),
        });
      })
      .catch(err => {
        // Show error toast if copying fails
        console.error('Failed to copy code: ', err);
        toast({
          title: t.coupons_error_title,
          description: t.coupons_error_desc,
          variant: "destructive",
        });
      });
  };

  if (loading) {
    return <p className="text-gray-400">{t.coupons_loading}</p>;
  }

  // Filter coupons on the frontend
  const activeCoupons = coupons.filter(c => c.is_active && c.used_count < c.usage_limit);
  const usedCoupons = coupons.filter(c => !c.is_active || c.used_count >= c.usage_limit);

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-amber-400 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {t.coupons_title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeCoupons.length === 0 && usedCoupons.length === 0 && (
          <p className="text-gray-400">{t.coupons_none}</p>
        )}

        {activeCoupons.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">{t.coupons_available}</h3>
            {activeCoupons.map(coupon => (
              <div key={coupon.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg border border-green-600">
                <div>
                  <p className="font-bold">{coupon.discount_percent}{t.coupons_off}</p>
                  <p className="text-sm text-gray-300">{coupon.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-lg font-mono bg-green-600 hover:bg-green-700">{coupon.code}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(coupon.code)}
                    className="text-gray-300 hover:text-white"
                    aria-label={t.coupons_copy_aria}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {usedCoupons.length > 0 && (
          <div className="space-y-3 mt-6 pt-4 border-t border-gray-700">
            <h3 className="font-semibold text-gray-500">{t.coupons_used}</h3>
            {usedCoupons.map(coupon => (
              <div key={coupon.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg opacity-50">
                <div>
                  <p className="font-bold">{coupon.discount_percent}{t.coupons_off}</p>
                  <p className="text-sm text-gray-300">{coupon.description}</p>
                </div>
                <Badge variant="secondary" className="text-lg font-mono line-through">{coupon.code}</Badge>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default MyCoupons;
