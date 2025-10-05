import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../theme/theme';

const HomeScreen = () => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Welcome back, {user?.firstName}!</Title>
        <Paragraph style={styles.subtitle}>
          Here's what's happening in your startup journey
        </Paragraph>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Your Progress</Title>
            <Paragraph>Track your startup's growth and milestones</Paragraph>
            <Button mode="contained" style={styles.button}>
              View Dashboard
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Upcoming Events</Title>
            <Paragraph>Don't miss out on networking opportunities</Paragraph>
            <Button mode="outlined" style={styles.button}>
              Browse Events
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Investor Connections</Title>
            <Paragraph>Connect with potential investors</Paragraph>
            <Button mode="outlined" style={styles.button}>
              View Investors
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
});

export default HomeScreen;
