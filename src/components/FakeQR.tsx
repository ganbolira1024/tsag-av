// Төлбөрийн QR (жишээ). Хамгаалалт-2-т QPay-ээс ирэх жинхэнэ QR-аар солигдоно.
// Захиалгын id-аас "санамсаргүй" боловч тогтвортой хээ үүсгэнэ (нэмэлт сан шаардлагагүй).
import { StyleSheet, View } from 'react-native';

const N = 25; // 25x25 нүд

// id-г тоо болгож, түүгээр псевдо-санамсаргүй тоо үүсгэгч (тогтвортой)
function makeRandom(seedText: string) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// QR-ын 3 буланд байдаг том дөрвөлжин тэмдэг мөн эсэх
function finder(r: number, c: number): boolean | null {
  for (const [r0, c0] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
    const y = r - r0, x = c - c0;
    if (y >= -1 && y <= 7 && x >= -1 && x <= 7) {
      if (y < 0 || y > 6 || x < 0 || x > 6) return false; // цагаан хүрээ
      const edge = y === 0 || y === 6 || x === 0 || x === 6;
      const core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
      return edge || core;
    }
  }
  return null;
}

export default function FakeQR({ value, size = 200 }: { value: string; size?: number }) {
  const rand = makeRandom(value);
  const cell = size / N;
  const rows = Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) => finder(r, c) ?? rand() > 0.5)
  );
  return (
    <View style={[styles.wrap, { width: size + 24, height: size + 24 }]}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((on, c) => (
            <View key={c} style={{ width: cell, height: cell, backgroundColor: on ? '#0F172A' : '#FFFFFF' }} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#fff', padding: 12, borderRadius: 12, alignSelf: 'center' },
});
