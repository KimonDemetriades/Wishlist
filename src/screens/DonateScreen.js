import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
} from 'expo-iap';

const DONATION_TIERS = [
  { id: 'tip_small_100',  label: '☕ Support dev - £1', price: '£1.00' },
  { id: 'tip_medium_300', label: '🍕 Support dev - £3',  price: '£3.00' },
  { id: 'tip_large_7',   label: '🚀 Support dev - £7',   price: '£7.00' },
];

const productIds = DONATION_TIERS.map(t => t.id);

// Covers all cancellation error codes/messages across platforms and versions
const isCancelledError = (err) => {
  return (
    err.code === 'E_USER_CANCELLED' ||
    err.code === 'user_cancelled' ||
    err.message?.toLowerCase().includes('cancel') ||
    err.message?.toLowerCase().includes('user cancelled')
  );
};

export default function DonateScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let purchaseUpdateSub;
    let purchaseErrorSub;

    const setup = async () => {
      try {
        await initConnection();

        // -----------------------------------------------
        // EDGE CASE: Catch any unfinished transactions
        // from previous sessions (e.g. app crash mid-purchase)
        // -----------------------------------------------
        try {
          const pendingPurchases = await getAvailablePurchases();
          if (pendingPurchases && pendingPurchases.length > 0) {
            for (const purchase of pendingPurchases) {
              await finishTransaction({ purchase, isConsumable: true });
            }
          }
        } catch (pendingError) {
          // Non-critical — log but don't block screen loading
          console.warn('Error clearing pending purchases:', pendingError);
        }
        // -----------------------------------------------

        const result = await fetchProducts({ skus: productIds, type: 'in-app' });
        setProducts(result);

        // Listen for successful purchases
        purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
          const receipt = purchase.transactionReceipt || purchase.purchaseToken;
          if (receipt) {
            try {
              await finishTransaction({ purchase, isConsumable: true });
              Alert.alert(
                'Thank You! 🙏',
                'Your support helps keep ListHappens free and improving!',
                [{ text: "You're welcome!", style: 'default' }]
              );
            } catch (finishError) {
              console.error('finishTransaction error:', finishError);
              Alert.alert(
                'Something went wrong',
                'Your payment went through but we hit an error. Please contact support.',
              );
            }
          }
          setLoading(false);
        });

        // Single source of truth for all purchase errors — catches both
        // listener and requestPurchase throw to prevent double alerts
        purchaseErrorSub = purchaseErrorListener((error) => {
          if (!isCancelledError(error)) {
            Alert.alert('Purchase Failed', error.message);
          }
          setLoading(false);
        });

      } catch (setupError) {
        console.error('IAP setup error:', setupError);
        setError('Could not connect to the store. Please try again later.');
      } finally {
        setInitialising(false);
      }
    };

    setup();

    // Cleanup on unmount
    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      endConnection();
    };
  }, []);

  const handleDonate = async (productId) => {
    setLoading(true);
    try {
      await requestPurchase({
        request: {
          apple: { sku: productId },
          google: { skus: [productId] },
        },
        type: 'in-app',
      });
      // All outcomes handled by purchaseUpdatedListener / purchaseErrorListener above
    } catch (err) {
      // Intentionally swallowed — purchaseErrorListener is the single
      // source of truth for errors. This catch only prevents an
      // unhandled promise rejection from crashing the app.
      setLoading(false);
    }
  };

  // Use live localised price from store, fallback to hardcoded
  // Android uses product.id, iOS uses product.productId — check both
  const getPrice = (tierId) => {
    const storeProduct = products.find(
      p => p.productId === tierId || p.id === tierId
    );
    return storeProduct?.localizedPrice || DONATION_TIERS.find(t => t.id === tierId)?.price;
  };

  // Loading state while connecting to store
  if (initialising) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Connecting to store...</Text>
      </View>
    );
  }

  // Error state if store connection failed
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setInitialising(true);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support Development</Text>
      <Text style={styles.subtitle}>
        ListHappens is free. If you enjoy it, a tip helps keep it alive and improving!
      </Text>

      {DONATION_TIERS.map((tier) => (
        <TouchableOpacity
          key={tier.id}
          style={[styles.tierButton, loading && styles.tierButtonDisabled]}
          onPress={() => handleDonate(tier.id)}
          disabled={loading}
        >
          <Text style={styles.tierLabel}>{tier.label}</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.tierPrice}>{getPrice(tier.id)}</Text>
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.disclaimer}>
        Tips are non-refundable and support ongoing development.{'\n'}
        No additional features are unlocked.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    lineHeight: 20,
  },
  tierButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tierButtonDisabled: {
    backgroundColor: '#7fb3f5',
  },
  tierLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tierPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    marginTop: 32,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});