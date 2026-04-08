import { supabase } from "@/src/utils/supabase";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
    }, 1000);

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="email@address.com"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setPassword(text)}
        value={password}
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry={true}
        textContentType="password"
      />

      {loading ? (
        <ActivityIndicator size="large" style={styles.spinner} />
      ) : (
        <View style={styles.buttonGroup}>
          <View style={styles.buttonWrap}>
            <Button title="Sign in" onPress={signInWithEmail} />
          </View>
          <View style={styles.buttonWrap}>
            <Button title="Sign up" onPress={signUpWithEmail} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    color: "#333",
    fontWeight: "600",
  },
  input: {
    height: 44,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  buttonGroup: {
    marginTop: 16,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  buttonWrap: {
    marginVertical: 6,
  },
  spinner: {
    marginTop: 12,
  },
});
