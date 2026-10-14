import React from 'react';
import { Image, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useColors, font } from '@/theme';

/** Shows a child's private photo through a short-lived signed URL (never a public URL). */
export function Avatar({ path, name, size = 96 }: { path: string | null; name: string; size?: number }) {
  const c = useColors();
  const { data: url } = useQuery({
    queryKey: ['photo', path], enabled: !!path, staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('child-media').createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return (
    <View accessibilityLabel={`${name} photo`} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.sky, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {url ? <Image source={{ uri: url }} style={{ width: size, height: size }} />
        : <Text style={{ fontFamily: font.bold, fontSize: size / 2.6, color: c.primary }}>{name.trim().charAt(0).toUpperCase()}</Text>}
    </View>
  );
}
