import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

const FEATURES = {
  ai_coach: {
    title: 'Coach IA personalizado',
    description: 'Recibe análisis de tu progreso y sesiones adaptadas a tu nivel cada semana.',
    price: '$4.99 / mes',
    cta: 'Quiero acceso anticipado',
  },
  advanced_stats: {
    title: 'Estadísticas avanzadas',
    description: 'Ve tu evolución por técnica, racha de entrenamiento y comparativa de nivel.',
    price: '$4.99 / mes',
    cta: 'Desbloquear estadísticas',
  },
}

export function PaywallModal({ visible, feature, onUpgrade, onDismiss }) {
  const content = FEATURES[feature] ?? FEATURES.ai_coach

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Beta exclusiva</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          {/* Precio simulado */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{content.price}</Text>
            <Text style={styles.priceSub}>· sin cobro durante la beta</Text>
          </View>

          {/* CTA principal — este es el click que mides */}
          <Pressable style={styles.btnPrimary} onPress={onUpgrade}>
            <Text style={styles.btnPrimaryText}>{content.cta} →</Text>
          </Pressable>

          <Pressable style={styles.btnSecondary} onPress={onDismiss}>
            <Text style={styles.btnSecondaryText}>Ahora no</Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            No se realizará ningún cobro. Solo queremos saber si esto te interesa.
          </Text>

        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E1F5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, color: '#0F6E56', fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '600', color: '#1a1a1a' },
  description: { fontSize: 15, color: '#555', lineHeight: 22 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  price: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  priceSub: { fontSize: 13, color: '#888' },
  btnPrimary: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary: { alignItems: 'center', padding: 12 },
  btnSecondaryText: { color: '#888', fontSize: 15 },
  disclaimer: { fontSize: 12, color: '#aaa', textAlign: 'center' },
})