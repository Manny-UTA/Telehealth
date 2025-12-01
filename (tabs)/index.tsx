import StickyHeader from '@/components/nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuPress = () => {
    setMenuOpen(!menuOpen);
    console.log('Menu pressed');
  };

  const handleLogoPress = () => {
    console.log('Logo pressed');
  };

  return (
    <ThemedView style={styles.container}>
      <StickyHeader onMenuPress={handleMenuPress} onLogoPress={handleLogoPress} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 56 } 
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <ThemedView style={styles.heroSection}>
          <Image
            source={require('@/assets/images/health-header.png')} 
            style={styles.headerImage}
            contentFit="cover"
          />
          <ThemedView style={styles.heroOverlay}>
            <ThemedText type="title" style={styles.heroTitle}>
              Your Health, Simplified
            </ThemedText>
            <ThemedText type="default" style={styles.heroSubtitle}>
              AI-powered healthcare support at your fingertips
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Quick Actions - Featured */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Get Started</ThemedText>
          
          <Link href={"/chatbot-demo" as any} asChild>
            <Pressable style={styles.primaryCard}>
              <ThemedView style={styles.cardIcon}>
                <ThemedText style={styles.iconLarge}>💬</ThemedText>
              </ThemedView>
              <ThemedView style={styles.cardContent}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  Symptom Checker
                </ThemedText>
                <ThemedText type="default" style={styles.cardDescription}>
                  Describe your symptoms and get guided next steps
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.arrow}>→</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>

        {/* Features Grid */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Features</ThemedText>
          
          <ThemedView style={styles.grid}>
            <Pressable style={styles.featureCard}>
              <ThemedText style={styles.featureIcon}></ThemedText>
              <ThemedText type="defaultSemiBold">Health Assessment</ThemedText>
              <ThemedText type="default" style={styles.featureText}>
                Guided symptom evaluation
              </ThemedText>
            </Pressable>

            <Pressable style={styles.featureCard}>
              <ThemedText style={styles.featureIcon}></ThemedText>
              <ThemedText type="defaultSemiBold">Track Health</ThemedText>
              <ThemedText type="default" style={styles.featureText}>
                Monitor your wellness
              </ThemedText>
            </Pressable>

            <Pressable style={styles.featureCard}>
              <ThemedText style={styles.featureIcon}></ThemedText>
              <ThemedText type="defaultSemiBold">Medication Info</ThemedText>
              <ThemedText type="default" style={styles.featureText}>
                Learn about medicines
              </ThemedText>
            </Pressable>

            <Pressable style={styles.featureCard}>
              <ThemedText style={styles.featureIcon}></ThemedText>
              <ThemedText type="defaultSemiBold">Appointments</ThemedText>
              <ThemedText type="default" style={styles.featureText}>
                Schedule visits easily
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Health Resources</ThemedText>
          
          <Link href={"/resources" as any} asChild>
            <Pressable style={styles.resourceCard}>
              <ThemedView style={styles.resourceLeft}>
                <ThemedText style={styles.resourceIcon}></ThemedText>
                <ThemedView>
                  <ThemedText type="defaultSemiBold">Health FAQs</ThemedText>
                  <ThemedText type="default" style={styles.resourceDesc}>
                    Common telehealth questions
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </Pressable>
          </Link>

          <Link href={"/articles" as any} asChild>
            <Pressable style={styles.resourceCard}>
              <ThemedView style={styles.resourceLeft}>
                <ThemedText style={styles.resourceIcon}></ThemedText>
                <ThemedView>
                  <ThemedText type="defaultSemiBold">Health Articles</ThemedText>
                  <ThemedText type="default" style={styles.resourceDesc}>
                    Trusted medical information
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </Pressable>
          </Link>

          <Link href={"/wellness-tips" as any} asChild>
            <Pressable style={styles.resourceCard}>
              <ThemedView style={styles.resourceLeft}>
                <ThemedText style={styles.resourceIcon}></ThemedText>
                <ThemedView>
                  <ThemedText type="defaultSemiBold">Wellness Tips</ThemedText>
                  <ThemedText type="default" style={styles.resourceDesc}>
                    Daily health recommendations
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>

        <ThemedView style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    position: 'relative',
    marginBottom: 24,
  },
  headerImage: {
    width: '100%',
    height: 240,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heroTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#10B981',
    borderRadius: 16,
    marginTop: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconLarge: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 13,
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 24,
    marginLeft: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  featureCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  resourceIcon: {
    fontSize: 24,
  },
  resourceDesc: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 20,
  },
});