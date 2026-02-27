import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import * as Linking from "expo-linking";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);
const TOKEN_KEY = "mptp_token";

const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();
const CreatorStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

type ContentItem = {
  _id: string;
  title: string;
  description: string;
  previewUrl?: string | null;
  price?: number | null;
  unlocked?: boolean;
  creator?: { id?: string; displayName?: string; username?: string };
};

type ContentDetail = {
  _id: string;
  title: string;
  description: string;
  files: Array<{ url: string; type: string; isLocked?: boolean; price?: number }>;
  creator: { id?: string; displayName?: string; username?: string };
  canAccess: boolean;
};

type CreatorItem = {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  verified?: boolean;
};

type CreatorDetail = CreatorItem & {
  contents: Array<{
    id: string;
    title: string;
    description: string;
    previewUrl?: string | null;
    unlocked?: boolean;
  }>;
};

type UserProfile = {
  displayName: string;
  username: string;
  role: string;
  subscriptionActive?: boolean;
  accessPassActive?: boolean;
  ageVerified?: boolean;
};

type RequestItem = {
  id: string;
  status: string;
  prompt: string;
  price: number;
  expiresAt: string;
  creator?: { displayName?: string };
  consumer?: { displayName?: string };
};

const linking = {
  prefixes: ["monpiedtonpied://", Linking.createURL("/")],
  config: {
    screens: {
      Accueil: "",
      Feed: {
        screens: {
          FeedList: "feed",
          ContentDetail: "content/:id",
        },
      },
      Creators: {
        screens: {
          CreatorsList: "creators",
          CreatorDetail: "creator/:id",
        },
      },
      Offres: "offers",
      Profil: {
        screens: {
          ProfileMain: "profile",
          Requests: "requests",
        },
      },
    },
  },
};

const useToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((value) => setToken(value));
  }, []);

  const saveToken = useCallback(async (value: string | null) => {
    if (value) {
      await AsyncStorage.setItem(TOKEN_KEY, value);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    setToken(value);
  }, []);

  return { token, saveToken };
};

type CheckoutOptions = {
  body?: Record<string, unknown>;
  successPath?: string;
  cancelPath?: string;
};

const openCheckout = async (
  path: string,
  token: string | null,
  options?: CheckoutOptions
) => {
  if (!token) {
    Alert.alert("Connexion requise", "Connecte-toi pour activer une offre.");
    return;
  }
  try {
    const successUrl = options?.successPath
      ? Linking.createURL(options.successPath)
      : undefined;
    const cancelUrl = options?.cancelPath ? Linking.createURL(options.cancelPath) : undefined;
    const payload: Record<string, unknown> = { ...(options?.body || {}) };
    if (successUrl) payload.successUrl = successUrl;
    if (cancelUrl) payload.cancelUrl = cancelUrl;
    const hasPayload = Object.keys(payload).length > 0;
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: hasPayload ? JSON.stringify(payload) : undefined,
    });
    const data = await response.json();
    if (data.url) {
      await Linking.openURL(data.url);
      return;
    }
    if (data.message) {
      Alert.alert("Info", data.message);
    }
  } catch {
    Alert.alert("Erreur", "Paiement impossible pour le moment.");
  }
};

function HomeScreen({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#050507", "#0b0b12", "#08080d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.navBar}>
            <View style={styles.logoMark} />
            <View>
              <Text style={styles.brand}>MonPiedTonPied</Text>
              <Text style={styles.brandSub}>Collectors Club</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.kicker}>Plateforme creators</Text>
            <Text style={styles.title}>L'univers premium des passionnes de pieds.</Text>
            <Text style={styles.subtitle}>
              Decouvre des collections exclusives, soutiens tes creators favoris et
              accede a des contenus photo et video soigneusement curates.
            </Text>
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Feed")}
              >
                <Text style={styles.primaryBtnText}>Explorer le contenu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate("Offres")}
              >
                <Text style={styles.ghostBtnText}>Voir les offres</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.glassCard}>
            <View style={styles.grid}>
              {["Studio rose", "Lumiere douce", "Bord de mer", "Vibes pastel"].map(
                (label) => (
                  <View key={label} style={styles.collectionCard}>
                    <Text style={styles.collectionLabel}>Collection</Text>
                    <Text style={styles.collectionTitle}>{label}</Text>
                  </View>
                )
              )}
            </View>
            <View style={styles.goldBanner}>
              <Text style={styles.goldKicker}>Nouveau</Text>
              <Text style={styles.goldTitle}>Serie exclusive "Velours"</Text>
            </View>
          </View>

          <View style={styles.threeCol}>
            {[
              {
                title: "Curation elegante",
                text: "Un feed epure qui met en valeur chaque creator.",
              },
              {
                title: "Monetisation simple",
                text: "Fixe tes prix, publie, et laisse la communaute soutenir.",
              },
              {
                title: "Connexion directe",
                text: "Messages prives et relations durables avec tes fans.",
              },
            ].map((item) => (
              <View key={item.title} style={styles.infoCard}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <StatusBar style="light" />
    </View>
  );
}

function BrowseScreen({ navigation }: { navigation: any }) {
  const { token } = useToken();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/content`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  return (
    <View style={styles.rootPlain}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Feed premium</Text>
          <Text style={styles.sectionText}>3 photos visibles par creator, le reste est floute.</Text>

          {loading && <Text style={styles.mutedText}>Chargement...</Text>}
          {!loading && items.length === 0 && (
            <Text style={styles.mutedText}>Aucun contenu disponible.</Text>
          )}

          {items.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.feedCard}
              onPress={() => navigation.navigate("ContentDetail", { id: item._id })}
            >
              <Text style={styles.collectionLabel}>Collection</Text>
              <Text style={styles.feedTitle}>{item.title}</Text>
              <Text style={styles.feedMeta}>
                {item.creator?.displayName || item.creator?.username || "Creator"}
              </Text>
              <Text style={styles.feedText} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.feedRow}>
                <Text style={styles.feedPrice}>
                  {typeof item.price === "number" ? `${item.price} EUR` : "Sur demande"}
                </Text>
                <Text style={styles.feedLock}>{item.unlocked ? "Debloque" : "Floute"}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ContentDetailScreen({ route }: { route: { params: { id: string } } }) {
  const { token } = useToken();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/content/${route.params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await response.json();
        if (response.ok) {
          setContent(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [route.params.id, token]);

  if (loading) {
    return (
      <View style={styles.rootPlain}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.mutedText}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.rootPlain}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.mutedText}>Contenu introuvable.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const price = content.files?.[0]?.price;

  return (
    <View style={styles.rootPlain}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>{content.title}</Text>
          <Text style={styles.sectionText}>{content.description}</Text>
          <Text style={styles.mutedText}>
            Creator: {content.creator.displayName || content.creator.username}
          </Text>

          <View style={styles.glassCard}>
            {content.files.map((file, index) => (
              <View key={`${file.url}-${index}`} style={styles.fileRow}>
                <Text style={styles.feedTitle}>{file.type.startsWith("video") ? "Video" : "Photo"}</Text>
                <Text style={styles.mutedText}>{file.isLocked ? "Floute" : "Disponible"}</Text>
              </View>
            ))}
          </View>

          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Debloquer</Text>
            <Text style={styles.mutedText}>Pass 5.99 EUR ou abonnement 11.99 EUR.</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() =>
                openCheckout("/api/stripe/checkout/pass", token, {
                  successPath: "profile?success=pass",
                  cancelPath: "profile?canceled=pass",
                })
              }
            >
              <Text style={styles.primaryBtnText}>Activer le pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() =>
                openCheckout("/api/stripe/checkout/subscription", token, {
                  successPath: "profile?success=subscription",
                  cancelPath: "profile?canceled=subscription",
                })
              }
            >
              <Text style={styles.ghostBtnText}>S'abonner</Text>
            </TouchableOpacity>
            {typeof price === "number" && price > 0 && (
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() =>
                  openCheckout("/api/stripe/checkout/content", token, {
                    body: { contentId: content._id },
                    successPath: `content/${content._id}?success=content`,
                    cancelPath: `content/${content._id}?canceled=content`,
                  })
                }
              >
                <Text style={styles.ghostBtnText}>Acheter {price} EUR</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function CreatorsScreen({ navigation }: { navigation: any }) {
  const { token } = useToken();
  const [creators, setCreators] = useState<CreatorItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/creators`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setCreators(data);
        }
      } catch {
        // ignore
      }
    };

    load();
  }, [token]);

  return (
    <View style={styles.rootPlain}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Creators</Text>
          <Text style={styles.sectionText}>Profils verifies et galleries premium.</Text>

          {creators.length === 0 && <Text style={styles.mutedText}>Aucun creator.</Text>}

          {creators.map((creator) => (
            <TouchableOpacity
              key={creator.id}
              style={styles.feedCard}
              onPress={() => navigation.navigate("CreatorDetail", { id: creator.id })}
            >
              <Text style={styles.feedTitle}>{creator.displayName}</Text>
              <Text style={styles.mutedText} numberOfLines={2}>
                {creator.bio || "Creator premium"}
              </Text>
              <Text style={styles.feedPrice}>{creator.verified ? "Verifie" : ""}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function CreatorDetailScreen({
  route,
  navigation,
}: {
  route: { params: { id: string } };
  navigation: any;
}) {
  const { token } = useToken();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [prompt, setPrompt] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/creators/${route.params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await response.json();
        if (response.ok) {
          setCreator({
            ...data,
            contents: Array.isArray(data.contents) ? data.contents : [],
          });
        }
      } catch {
        // ignore
      }
    };

    load();
  }, [route.params.id, token]);

  if (!creator) {
    return (
      <View style={styles.rootPlain}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.mutedText}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.rootPlain}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>{creator.displayName}</Text>
          <Text style={styles.sectionText}>{creator.bio || "Creator premium"}</Text>

          <View style={styles.glassCard}>
            <Text style={styles.offerTitle}>Galerie</Text>
            {creator.contents.length === 0 && (
              <Text style={styles.mutedText}>Aucun contenu.</Text>
            )}
            {creator.contents.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.fileRow}
                onPress={() => navigation.navigate("ContentDetail", { id: item.id })}
              >
                <Text style={styles.feedTitle}>{item.title}</Text>
                <Text style={styles.mutedText}>{item.unlocked ? "Debloque" : "Floute"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Demande personnalisee</Text>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Description (pieds uniquement)"
              placeholderTextColor="#6f675a"
              style={styles.input}
            />
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="Prix (ex: 29.99)"
              placeholderTextColor="#6f675a"
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() =>
                openCheckout("/api/stripe/checkout/request", token, {
                  body: {
                    creatorId: creator.id,
                    prompt,
                    price,
                  },
                  successPath: "requests?success=request",
                  cancelPath: `creator/${creator.id}?canceled=request`,
                })
              }
            >
              <Text style={styles.primaryBtnText}>Envoyer la demande</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Abonnement</Text>
            <Text style={styles.mutedText}>Acces complet + chat illimite.</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() =>
                openCheckout("/api/stripe/checkout/subscription", token, {
                  successPath: "profile?success=subscription",
                  cancelPath: "profile?canceled=subscription",
                })
              }
            >
              <Text style={styles.primaryBtnText}>S'abonner</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function OffersScreen() {
  const { token } = useToken();

  return (
    <View style={styles.rootPlain}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Offres premium</Text>
          <Text style={styles.sectionText}>
            Pass 5.99 EUR ou abonnement 11.99 EUR. Chat inclus sur abonnement.
          </Text>

          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Pass 30 jours</Text>
            <Text style={styles.offerPrice}>5.99 EUR</Text>
            <Text style={styles.mutedText}>Acces aux collections. Pas de chat.</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() =>
                openCheckout("/api/stripe/checkout/pass", token, {
                  successPath: "profile?success=pass",
                  cancelPath: "profile?canceled=pass",
                })
              }
            >
              <Text style={styles.primaryBtnText}>Activer le pass</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Abonnement</Text>
            <Text style={styles.offerPrice}>11.99 EUR</Text>
            <Text style={styles.mutedText}>Acces complet + chat illimite.</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() =>
                openCheckout("/api/stripe/checkout/subscription", token, {
                  successPath: "profile?success=subscription",
                  cancelPath: "profile?canceled=subscription",
                })
              }
            >
              <Text style={styles.primaryBtnText}>S'abonner</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ProfileScreen({ navigation }: { navigation: any }) {
  const { token, saveToken } = useToken();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data);
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.includes("@") ? identifier : undefined,
          username: !identifier.includes("@") ? identifier : undefined,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Erreur", data.message || "Connexion impossible");
        return;
      }
      await saveToken(data.token);
      setIdentifier("");
      setPassword("");
      loadProfile();
    } catch {
      Alert.alert("Erreur", "Connexion impossible");
    }
  };

  const handleLogout = async () => {
    await saveToken(null);
    setProfile(null);
  };

  return (
    <View style={styles.rootPlain}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Profil</Text>

          {!token ? (
            <View style={styles.glassCard}>
              <Text style={styles.sectionText}>Connecte-toi pour acceder au profil.</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Email ou pseudo"
                placeholderTextColor="#6f675a"
                style={styles.input}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe"
                placeholderTextColor="#6f675a"
                secureTextEntry
                style={styles.input}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
                <Text style={styles.primaryBtnText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.glassCard}>
              <Text style={styles.offerTitle}>{profile?.displayName || "Utilisateur"}</Text>
              <Text style={styles.mutedText}>Role: {profile?.role || "consumer"}</Text>
              <Text style={styles.mutedText}>
                Age verifie: {profile?.ageVerified ? "oui" : "non"}
              </Text>
              <Text style={styles.mutedText}>
                Pass: {profile?.accessPassActive ? "actif" : "non"}
              </Text>
              <Text style={styles.mutedText}>
                Abonnement: {profile?.subscriptionActive ? "actif" : "non"}
              </Text>
              {profile?.role === "creator" && (
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => navigation.navigate("Requests")}
                >
                  <Text style={styles.ghostBtnText}>Voir les demandes</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.ghostBtn} onPress={handleLogout}>
                <Text style={styles.ghostBtnText}>Se deconnecter</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RequestsScreen() {
  const { token } = useToken();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE}/api/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setRequests(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    load();
    if (token) {
      fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setIsCreator(data.role === "creator"))
        .catch(() => {});
    }
  }, [token]);

  const handleAction = async (id: string, action: "accept" | "decline") => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/requests/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.message) {
        Alert.alert("Info", data.message);
      }
    } catch {
      Alert.alert("Erreur", "Action impossible.");
    }
  };

  return (
    <View style={styles.rootPlain}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Demandes</Text>
          <Text style={styles.sectionText}>Gestion des demandes custom. Reponse sous 48h.</Text>

          {loading && <Text style={styles.mutedText}>Chargement...</Text>}
          {!loading && requests.length === 0 && (
            <Text style={styles.mutedText}>Aucune demande.</Text>
          )}

          {requests.map((req) => (
            <View key={req.id} style={styles.feedCard}>
              <Text style={styles.feedTitle}>{req.prompt}</Text>
              <Text style={styles.mutedText}>Prix: {req.price} EUR</Text>
              <Text style={styles.mutedText}>Statut: {req.status}</Text>
              {isCreator && (
                <View style={styles.feedRow}>
                  <TouchableOpacity
                    style={styles.ghostBtn}
                    onPress={() => handleAction(req.id, "accept")}
                  >
                    <Text style={styles.ghostBtnText}>Accepter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ghostBtn}
                    onPress={() => handleAction(req.id, "decline")}
                  >
                    <Text style={styles.ghostBtnText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeedStackScreen() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedList" component={BrowseScreen} />
      <FeedStack.Screen name="ContentDetail" component={ContentDetailScreen} />
    </FeedStack.Navigator>
  );
}

function CreatorStackScreen() {
  return (
    <CreatorStack.Navigator screenOptions={{ headerShown: false }}>
      <CreatorStack.Screen name="CreatorsList" component={CreatorsScreen} />
      <CreatorStack.Screen name="CreatorDetail" component={CreatorDetailScreen} />
      <CreatorStack.Screen name="ContentDetail" component={ContentDetailScreen} />
    </CreatorStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Requests" component={RequestsScreen} />
    </ProfileStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0b0a0f",
            borderTopColor: "rgba(255,255,255,0.08)",
            height: 62,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: "#c7a46a",
          tabBarInactiveTintColor: "#8d8577",
        }}
      >
        <Tab.Screen name="Accueil" component={HomeScreen} />
        <Tab.Screen name="Feed" component={FeedStackScreen} />
        <Tab.Screen name="Creators" component={CreatorStackScreen} />
        <Tab.Screen name="Offres" component={OffersScreen} />
        <Tab.Screen name="Profil" component={ProfileStackScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050507",
  },
  rootPlain: {
    flex: 1,
    backgroundColor: "#0b0a0f",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    gap: 20,
  },
  orbTop: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.18)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -140,
    left: -140,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(143,107,57,0.2)",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.2)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.5)",
  },
  brand: {
    color: "#f4ede3",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  brandSub: {
    color: "#b7ad9c",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  hero: {
    gap: 12,
  },
  kicker: {
    color: "#d8c7a8",
    fontSize: 10,
    letterSpacing: 3.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#f4ede3",
    fontSize: 34,
    fontWeight: "700",
  },
  subtitle: {
    color: "#b7ad9c",
    fontSize: 14,
    lineHeight: 20,
  },
  ctaRow: {
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#c7a46a",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  primaryBtnText: {
    textAlign: "center",
    color: "#0b0a0f",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ghostBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ghostBtnText: {
    textAlign: "center",
    color: "#d6cbb8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  glassCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  collectionCard: {
    flexBasis: "48%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  collectionLabel: {
    color: "#b7ad9c",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  collectionTitle: {
    color: "#f4ede3",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  goldBanner: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#c7a46a",
  },
  goldKicker: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#0b0a0f",
  },
  goldTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#0b0a0f",
  },
  threeCol: {
    gap: 14,
  },
  infoCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  infoTitle: {
    color: "#f4ede3",
    fontSize: 18,
    fontWeight: "600",
  },
  infoText: {
    color: "#b7ad9c",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  sectionTitle: {
    color: "#f4ede3",
    fontSize: 22,
    fontWeight: "600",
  },
  sectionText: {
    color: "#b7ad9c",
    fontSize: 13,
    lineHeight: 18,
  },
  mutedText: {
    color: "#b7ad9c",
    fontSize: 12,
  },
  feedCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  feedTitle: {
    color: "#f4ede3",
    fontSize: 16,
    fontWeight: "600",
  },
  feedMeta: {
    color: "#b7ad9c",
    fontSize: 12,
  },
  feedText: {
    color: "#b7ad9c",
    fontSize: 12,
  },
  feedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  feedPrice: {
    color: "#f0d8ac",
    fontSize: 12,
    fontWeight: "600",
  },
  feedLock: {
    color: "#8d8577",
    fontSize: 12,
  },
  offerCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 10,
  },
  offerTitle: {
    color: "#f4ede3",
    fontSize: 18,
    fontWeight: "600",
  },
  offerPrice: {
    color: "#c7a46a",
    fontSize: 20,
    fontWeight: "700",
  },
  input: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#101016",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f4ede3",
  },
  fileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
});
