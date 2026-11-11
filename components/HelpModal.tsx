import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { blackAlpha, colors, radii, shadow } from '../constants/theme';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_ITEMS = [
  {
    question: 'Como adiciono uma receita ou despesa?',
    answer:
      'Na tela Início, toque em "Adicionar Receita" ou "Adicionar Despesa" nos Atalhos Rápidos, ou vá até Transações e toque no botão verde "+" no canto inferior direito.',
  },
  {
    question: 'Como edito ou excluo uma transação?',
    answer:
      'Toque na transação desejada na lista de Transações. Um menu vai abrir com as opções de editar ou excluir.',
  },
  {
    question: 'Como crio uma nova categoria?',
    answer:
      'Ao adicionar uma transação, toque em "Nova" na lista de categorias — ou vá em Perfil › Categorias. Escolha se ela é de Despesa ou de Receita, o nome, a cor e o ícone.',
  },
  {
    question: 'Como filtro as transações por mês ou categoria?',
    answer:
      'Na tela Transações, use as flechinhas ‹ › para trocar de mês ou toque no período para escolher um mês, uma data ou um período. Logo abaixo, marque as categorias que deseja ver; sem nenhuma marcada, todas aparecem.',
  },
  {
    question: 'Como crio uma meta financeira?',
    answer:
      'Na tela Início, toque em "Adicionar Meta" nos Atalhos Rápidos. Dê um nome e defina o valor que deseja alcançar.',
  },
  {
    question: 'Como adiciono valor a uma meta?',
    answer:
      'Na tela Relatórios, toque em "Adicionar Valor" no card da meta. O progresso é atualizado automaticamente e, ao atingir o valor da meta, ela é marcada como concluída.',
  },
  {
    question: 'Meus dados ficam salvos?',
    answer:
      'Sim. Todas as transações, metas e informações do perfil ficam salvas no seu dispositivo automaticamente, mesmo depois de fechar o app.',
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerBtn}>
              <Feather name="x" size={20} color={blackAlpha(0.6)} />
            </Pressable>
            <Text style={styles.headerTitle}>Central de Ajuda</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.sectionLabel}>Perguntas Frequentes</Text>

            {FAQ_ITEMS.map((item, index) => {
              const isOpenItem = openIndex === index;
              return (
                <Pressable
                  key={index}
                  style={styles.faqItem}
                  onPress={() => setOpenIndex(isOpenItem ? null : index)}
                >
                  <View style={styles.faqQuestionRow}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Feather
                      name={isOpenItem ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={blackAlpha(0.4)}
                    />
                  </View>
                  {isOpenItem && <Text style={styles.faqAnswer}>{item.answer}</Text>}
                </Pressable>
              );
            })}

            <View style={styles.contactBox}>
              <Feather name="mail" size={18} color={colors.emerald600} />
              <Text style={styles.contactText}>
                Não encontrou o que precisava? Fale com a gente em{' '}
                <Text style={styles.contactEmail}>suporte@mony.app</Text>
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii['3xl'],
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.emerald200,
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.emerald600,
    fontSize: 16,
  },
  body: {
    padding: 24,
  },
  sectionLabel: {
    fontSize: 13,
    color: blackAlpha(0.5),
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
    marginBottom: 10,
    ...shadow.sm,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  faqAnswer: {
    fontSize: 13,
    color: blackAlpha(0.6),
    marginTop: 12,
    lineHeight: 20,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
    marginTop: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 13,
    color: blackAlpha(0.7),
    lineHeight: 19,
  },
  contactEmail: {
    color: colors.emerald600,
    fontWeight: '600',
  },
});
