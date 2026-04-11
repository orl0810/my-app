import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

const PAYWALL_FEATURES = [
  {
    title: 'Session plan tailored to your core level',
    description:
      'The coach analyzes your history, level, and goals to suggest what to train each day. No more guessing what session to do.',
  },
  {
    title: 'Automatic core difficulty progression',
    description:
      'If you mark sessions as "easy" repeatedly, the coach will increase the level. If you mark them as "hard", the coach will adjust the pace. The app learns with you.',
  },
  {
    title: 'Sessions for training alone or in pairs',
    description:
      "The coach detects whether you'll be training alone or with a partner and adapts the exercises accordingly. There's no point in suggesting multi-ball exercises if you don't have anyone to use them.",
  },
]

const FEATURES = {
  ai_coach: {
    title: 'Coach IA personalizado',
    description: 'Receive analysis of your progress and sessions adapted to your level each week.',
    price: '$4.99 / month',
    cta: 'Get early access',
  },
  advanced_stats: {
    title: 'Advanced statistics',
    description: 'See your progress by technique, training streak and level comparison.',
    price: '$4.99 / month',
    cta: 'Unlock advanced statistics',
  },
}

export function PaywallModal({ visible, feature, onUpgrade, onDismiss }) {
  const content = FEATURES[feature] ?? FEATURES.ai_coach

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Exclusive beta</Text>
            </View>

            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.description}>{content.description}</Text>

            <View style={styles.featuresList}>
              {PAYWALL_FEATURES.map((item) => (
                <View key={item.title} style={styles.featureRow}>
                  <Text style={styles.featureBullet}>✓</Text>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Precio simulado */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{content.price}</Text>
              <Text style={styles.priceSub}>· no charge during beta</Text>
            </View>

            {/* CTA principal — este es el click que mides */}
            <Pressable style={styles.btnPrimary} onPress={onUpgrade}>
              <Text style={styles.btnPrimaryText}>{content.cta} →</Text>
            </Pressable>

            <Pressable style={styles.btnSecondary} onPress={onDismiss}>
              <Text style={styles.btnSecondaryText}>Not now</Text>
            </Pressable>

            <Text style={styles.disclaimer}>
              No will be charged. We just want to know if this interests you.
            </Text>
          </ScrollView>
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
    maxHeight: '92%',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  featuresList: {
    gap: 16,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureBullet: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '700',
    marginTop: 3,
    lineHeight: 20,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
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