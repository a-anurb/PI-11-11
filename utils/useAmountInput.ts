import { useCallback, useState } from 'react';

// Converte uma string de dígitos (em centavos) para o formato "0,00"
function digitsToDisplay(digits: string): string {
  const clean = digits.replace(/[^\d]/g, '') || '0';
  return (parseInt(clean, 10) / 100).toFixed(2).replace('.', ',');
}

/**
 * Hook usado nos campos de valor (transações e metas).
 * O valor é digitado pelo TECLADO NATIVO do celular (TextInput com
 * keyboardType="number-pad"). Cada dígito entra como centavo, no estilo
 * "maquininha": 1 → 0,01 · 12 → 0,12 · 1234 → 12,34.
 */
export function useAmountInput(initial = '0,00') {
  const [value, setValue] = useState(initial);

  const handleChangeText = useCallback((text: string) => {
    setValue((current) => {
      if (text.length > current.length) {
        const added = text.slice(current.length).replace(/[^\d]/g, '');
        if (!added) {
          // texto colado/selecionado inteiro: usa só os dígitos
          const all = text.replace(/[^\d]/g, '');
          return all ? digitsToDisplay(all) : current;
        }
        return digitsToDisplay(current.replace(/[^\d]/g, '') + added);
      }
      if (text.length < current.length) {
        // apagou (backspace) ou substituiu uma seleção
        const typed = text.replace(/[^\d]/g, '');
        const currentDigits = current.replace(/[^\d]/g, '');
        if (currentDigits.startsWith(typed) || typed.length === 0) {
          return digitsToDisplay(currentDigits.slice(0, -1));
        }
        return digitsToDisplay(typed);
      }
      return current;
    });
  }, []);

  return { value, setValue, handleChangeText };
}
