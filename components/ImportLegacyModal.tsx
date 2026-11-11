import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { brand, colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { importLegacySource, listLegacySources } from '../lib/cloudData';

interface Props { isOpen: boolean; onClose: () => void; }
type Source = { id: string; label: string; count: number };

/** Explicit confirmation avoids silently assigning data from another local login. */
export function ImportLegacyModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen || !user) return;
    let mounted = true;
    setSelected(''); setDone(''); setError(''); setLoading(true);
    listLegacySources(user.id).then((found) => { if (mounted) setSources(found); })
      .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [isOpen, user?.id]);

  const importSelected = async () => {
    if (!selected || !user) return;
    setLoading(true); setError('');
    try {
      const { imported, skipped } = await importLegacySource(user.id, selected);
      setDone(`${imported} conjunto(s) importado(s) e ${skipped} ignorado(s) porque já existiam na nuvem. Os dados antigos no dispositivo foram preservados.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao importar.'); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}><Text style={styles.title}>Importar dados antigos</Text><Pressable onPress={onClose}><Feather name="x" size={22} color={colors.text} /></Pressable></View>
          <Text style={styles.text}>Selecione a conta antiga que era usada neste aparelho. Importe somente dados que pertencem a você.</Text>
          <Text style={styles.warning}>Por segurança, a importação não substitui registros já existentes no Firebase nem apaga dados do aparelho.</Text>
          {loading && <ActivityIndicator color={brand.green} style={{ marginVertical: 20 }} />}
          {!loading && !done && sources.length === 0 && <Text style={styles.text}>Não foram encontrados dados locais de versões anteriores.</Text>}
          <ScrollView style={{ maxHeight: 300 }}>
            {!done && sources.map((source) => (
              <Pressable key={source.id} onPress={() => setSelected(source.id)} style={[styles.option, selected === source.id && styles.selected]}>
                <Feather name={selected === source.id ? 'check-circle' : 'circle'} size={19} color={brand.green} />
                <View style={{ flex: 1 }}><Text style={styles.optionTitle}>{source.label}</Text><Text style={styles.text}>{source.count} conjunto(s) de dados</Text></View>
              </Pressable>
            ))}
          </ScrollView>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!done && <Text style={styles.success}>{done}</Text>}
          {!!done && <Text style={styles.text}>Transações, metas e categorias serão atualizadas pela sincronização. Se não aparecerem, feche e reabra o aplicativo.</Text>}
          {!done && sources.length > 0 && <Pressable disabled={loading || !selected} style={[styles.button, (!selected || loading) && { opacity: 0.5 }]} onPress={importSelected}><Text style={styles.buttonLabel}>Confirmar importação</Text></Pressable>}
          <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{done ? 'Concluir' : 'Cancelar'}</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  dialog: { width: '100%', maxWidth: 470, alignSelf: 'center', backgroundColor: colors.white, padding: 21, borderRadius: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginVertical: 4 },
  warning: { color: '#92400e', backgroundColor: '#fffbeb', padding: 10, borderRadius: 10, fontSize: 12, marginVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: colors.gray300, borderRadius: 12, marginVertical: 5 },
  selected: { borderColor: brand.green, backgroundColor: '#f0fdf4' },
  optionTitle: { color: colors.text, fontWeight: '700' },
  button: { backgroundColor: brand.green, padding: 15, alignItems: 'center', borderRadius: 13, marginTop: 15 },
  buttonLabel: { color: 'white', fontWeight: '800' },
  cancel: { padding: 12, alignItems: 'center' },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  error: { color: colors.red600, marginTop: 8 },
  success: { color: brand.green, fontWeight: '700', marginTop: 10 },
});
