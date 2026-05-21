import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

type JobStatus = "Nowe" | "Pomiar" | "Wycena" | "Do montażu" | "Zakończone";
type SpeechListener = { remove: () => void };

type FenceJob = {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  length: string;
  height: string;
  fenceType: string;
  gate: string;
  wicket: string;
  color: string;
  notes: string;
  status: JobStatus;
  voiceNoteUri?: string;
  createdAt: string;
};
type JobForm = Omit<FenceJob, "id" | "createdAt" | "voiceNoteUri">;

const STORAGE_KEY = "ogrodzenia.jobs.v1";
const statuses: JobStatus[] = ["Nowe", "Pomiar", "Wycena", "Do montażu", "Zakończone"];

const emptyForm: JobForm = {
  clientName: "",
  phone: "",
  address: "",
  length: "",
  height: "",
  fenceType: "",
  gate: "",
  wicket: "",
  color: "",
  notes: "",
  status: "Nowe"
};
type FormField = keyof typeof emptyForm;
type VoiceField = Exclude<FormField, "status">;

declare const require: (moduleName: string) => any;

export default function App() {
  const [jobs, setJobs] = useState<FenceJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [listeningField, setListeningField] = useState<VoiceField | null>(null);
  const speechModuleRef = useRef<any>(null);
  const speechListenersRef = useRef<SpeechListener[]>([]);
  const voiceSessionRef = useRef<{ field: VoiceField; baseValue: string } | null>(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedId) ?? null,
    [jobs, selectedId]
  );
  const filteredJobs = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    if (!phrase) return jobs;

    return jobs.filter((job) =>
      [job.clientName, job.phone, job.address, job.status]
        .join(" ")
        .toLowerCase()
        .includes(phrase)
    );
  }, [jobs, search]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setJobs(JSON.parse(raw));
        }
      })
      .catch(() => Alert.alert("Blad", "Nie udalo sie wczytac zapisanych zlecen."));
  }, []);

  useEffect(() => {
    return () => {
      removeSpeechListeners();
      speechModuleRef.current?.abort?.();
    };
  }, []);

  const saveJobs = useCallback(async (nextJobs: FenceJob[]) => {
    setJobs(nextJobs);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextJobs));
  }, []);

  const updateForm = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  function removeSpeechListeners() {
    speechListenersRef.current.forEach((listener) => listener.remove());
    speechListenersRef.current = [];
  }

  const loadSpeechRecognition = () => {
    if (speechModuleRef.current) {
      return speechModuleRef.current;
    }

    try {
      speechModuleRef.current = require("expo-speech-recognition").ExpoSpeechRecognitionModule;
      return speechModuleRef.current;
    } catch {
      return null;
    }
  };

  const composeVoiceValue = (field: VoiceField, baseValue: string, spokenText: string) => {
    const spoken = spokenText.trim();
    const base = baseValue.trimEnd();

    if (!spoken) return baseValue;
    if (!base) return spoken;
    return field === "notes" ? `${base}\n${spoken}` : `${base} ${spoken}`;
  };

  const showKeyboardVoiceFallback = () => {
    Alert.alert(
      "Wpisywanie głosem",
      "W tym podglądzie użyj mikrofonu na klawiaturze telefonu. Pełny przycisk głosowy zadziała w instalowanej wersji aplikacji."
    );
  };

  const stopVoiceInput = async () => {
    const speechModule = speechModuleRef.current;
    if (!speechModule) return;

    try {
      await speechModule.stop();
    } finally {
      setListeningField(null);
      voiceSessionRef.current = null;
    }
  };

  const startVoiceInput = async (field: VoiceField) => {
    if (recording) {
      Alert.alert("Mikrofon zajęty", "Najpierw zatrzymaj nagrywanie notatki głosowej.");
      return;
    }

    if (listeningField === field) {
      await stopVoiceInput();
      return;
    }

    const speechModule = loadSpeechRecognition();
    if (!speechModule) {
      showKeyboardVoiceFallback();
      return;
    }

    try {
      const available = await speechModule.isRecognitionAvailable?.();
      if (available === false) {
        showKeyboardVoiceFallback();
        return;
      }

      const permission = await speechModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Brak dostępu", "Włącz mikrofon i rozpoznawanie mowy w ustawieniach telefonu.");
        return;
      }

      removeSpeechListeners();
      voiceSessionRef.current = { field, baseValue: form[field] };
      setListeningField(field);

      speechListenersRef.current = [
        speechModule.addListener("result", (event: any) => {
          const transcript = event.results?.[0]?.transcript ?? "";
          const session = voiceSessionRef.current;
          if (!session) return;

          setForm((current) => ({
            ...current,
            [session.field]: composeVoiceValue(session.field, session.baseValue, transcript)
          }));
        }),
        speechModule.addListener("end", () => {
          setListeningField(null);
          voiceSessionRef.current = null;
          removeSpeechListeners();
        }),
        speechModule.addListener("error", (event: any) => {
          setListeningField(null);
          voiceSessionRef.current = null;
          removeSpeechListeners();
          if (event.error !== "aborted" && event.error !== "no-speech") {
            Alert.alert("Nie udało się rozpoznać mowy", event.message ?? "Spróbuj jeszcze raz.");
          }
        })
      ];

      await speechModule.start({
        lang: "pl-PL",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        iosTaskHint: "dictation"
      });
    } catch {
      setListeningField(null);
      voiceSessionRef.current = null;
      removeSpeechListeners();
      showKeyboardVoiceFallback();
    }
  };

  const closeForm = () => {
    stopVoiceInput();
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveForm = async () => {
    if (!form.clientName.trim() || !form.phone.trim() || !form.address.trim()) {
      Alert.alert("Brakuje danych", "Wpisz klienta, telefon i adres.");
      return;
    }

    if (editingId) {
      const nextJobs = jobs.map((job) =>
        job.id === editingId ? { ...job, ...form } : job
      );
      await saveJobs(nextJobs);
      setSelectedId(editingId);
      closeForm();
      return;
    }

    const newJob: FenceJob = {
      ...form,
      id: String(Date.now()),
      createdAt: new Date().toISOString()
    };

    const nextJobs = [newJob, ...jobs];
    await saveJobs(nextJobs);
    setSelectedId(newJob.id);
    closeForm();
  };

  const editSelectedJob = () => {
    if (!selectedJob) return;

    setForm({
      clientName: selectedJob.clientName,
      phone: selectedJob.phone,
      address: selectedJob.address,
      length: selectedJob.length,
      height: selectedJob.height,
      fenceType: selectedJob.fenceType,
      gate: selectedJob.gate,
      wicket: selectedJob.wicket,
      color: selectedJob.color,
      notes: selectedJob.notes,
      status: selectedJob.status
    });
    setEditingId(selectedJob.id);
  };

  const updateSelectedJob = async (patch: Partial<FenceJob>) => {
    if (!selectedJob) return;

    const nextJobs = jobs.map((job) =>
      job.id === selectedJob.id ? { ...job, ...patch } : job
    );
    await saveJobs(nextJobs);
  };

  const deleteSelectedJob = () => {
    if (!selectedJob) return;

    Alert.alert("Usunac zlecenie?", selectedJob.clientName, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          await saveJobs(jobs.filter((job) => job.id !== selectedJob.id));
          setSelectedId(null);
        }
      }
    ]);
  };

  const callClient = () => {
    if (selectedJob?.phone) {
      Linking.openURL(`tel:${selectedJob.phone.replace(/\s/g, "")}`);
    }
  };

  const openMaps = () => {
    if (!selectedJob?.address) return;
    const query = encodeURIComponent(selectedJob.address);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`);
  };

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Brak dostępu", "Włącz dostęp do mikrofonu, aby nagrywać notatki.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true
    });

    const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(result.recording);
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      await updateSelectedJob({ voiceNoteUri: uri });
      Alert.alert("Zapisano", "Notatka głosowa została dodana do zlecenia.");
    }
  };

  const playVoiceNote = async () => {
    if (!selectedJob?.voiceNoteUri) return;
    const { sound } = await Audio.Sound.createAsync({ uri: selectedJob.voiceNoteUri });
    await sound.playAsync();
  };

  if (isAdding || editingId) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{editingId ? "Edycja" : "Nowe zlecenie"}</Text>
              <Pressable style={styles.iconButton} onPress={closeForm}>
                <Text style={styles.iconButtonText}>X</Text>
              </Pressable>
            </View>
            <Input label="Klient" value={form.clientName} onChangeText={(value) => updateForm("clientName", value)} onVoicePress={() => startVoiceInput("clientName")} isListening={listeningField === "clientName"} />
            <Input label="Telefon" value={form.phone} keyboardType="phone-pad" onChangeText={(value) => updateForm("phone", value)} onVoicePress={() => startVoiceInput("phone")} isListening={listeningField === "phone"} />
            <Input label="Adres" value={form.address} onChangeText={(value) => updateForm("address", value)} onVoicePress={() => startVoiceInput("address")} isListening={listeningField === "address"} />
            <View style={styles.twoColumns}>
              <Input label="Długość" value={form.length} onChangeText={(value) => updateForm("length", value)} onVoicePress={() => startVoiceInput("length")} isListening={listeningField === "length"} />
              <Input label="Wysokość" value={form.height} onChangeText={(value) => updateForm("height", value)} onVoicePress={() => startVoiceInput("height")} isListening={listeningField === "height"} />
            </View>
            <Input label="Typ ogrodzenia" value={form.fenceType} onChangeText={(value) => updateForm("fenceType", value)} onVoicePress={() => startVoiceInput("fenceType")} isListening={listeningField === "fenceType"} />
            <View style={styles.twoColumns}>
              <Input label="Brama" value={form.gate} onChangeText={(value) => updateForm("gate", value)} onVoicePress={() => startVoiceInput("gate")} isListening={listeningField === "gate"} />
              <Input label="Furtka" value={form.wicket} onChangeText={(value) => updateForm("wicket", value)} onVoicePress={() => startVoiceInput("wicket")} isListening={listeningField === "wicket"} />
            </View>
            <Input label="Kolor" value={form.color} onChangeText={(value) => updateForm("color", value)} onVoicePress={() => startVoiceInput("color")} isListening={listeningField === "color"} />
            <Input label="Notatki" value={form.notes} multiline onChangeText={(value) => updateForm("notes", value)} onVoicePress={() => startVoiceInput("notes")} isListening={listeningField === "notes"} />
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusWrap}>
              {statuses.map((status) => (
                <Pressable
                  key={status}
                  style={[styles.statusChip, form.status === status && styles.statusChipActive]}
                  onPress={() => setForm((current) => ({ ...current, status }))}
                >
                  <Text style={[styles.statusChipText, form.status === status && styles.statusChipTextActive]}>
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.primaryButton} onPress={saveForm}>
              <Text style={styles.primaryButtonText}>{editingId ? "Zapisz zmiany" : "Zapisz zlecenie"}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (selectedJob) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable style={styles.iconButton} onPress={() => setSelectedId(null)}>
              <Text style={styles.iconButtonText}>‹</Text>
            </Pressable>
            <Text style={styles.title}>{selectedJob.clientName}</Text>
            <Pressable style={styles.iconButtonDanger} onPress={deleteSelectedJob}>
              <Text style={styles.iconButtonDangerText}>Usuń</Text>
            </Pressable>
          </View>

          <View style={styles.actionGrid}>
            <Pressable style={styles.actionButton} onPress={callClient}>
              <Text style={styles.actionButtonText}>Zadzwon</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={openMaps}>
              <Text style={styles.actionButtonText}>Google Maps</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={editSelectedJob}>
              <Text style={styles.actionButtonText}>Edytuj</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, recording && styles.recordingButton]}
              onPress={recording ? stopRecording : startRecording}
            >
              <Text style={styles.actionButtonText}>{recording ? "Stop" : "Mikrofon"}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, !selectedJob.voiceNoteUri && styles.actionButtonDisabled]}
              onPress={playVoiceNote}
              disabled={!selectedJob.voiceNoteUri}
            >
              <Text style={styles.actionButtonText}>Odtwórz</Text>
            </Pressable>
          </View>

          <Detail label="Telefon" value={selectedJob.phone} />
          <Detail label="Adres" value={selectedJob.address} />
          <Detail label="Status" value={selectedJob.status} />
          <View style={styles.twoColumns}>
            <Detail label="Długość" value={selectedJob.length || "-"} />
            <Detail label="Wysokość" value={selectedJob.height || "-"} />
          </View>
          <Detail label="Typ ogrodzenia" value={selectedJob.fenceType || "-"} />
          <View style={styles.twoColumns}>
            <Detail label="Brama" value={selectedJob.gate || "-"} />
            <Detail label="Furtka" value={selectedJob.wicket || "-"} />
          </View>
          <Detail label="Kolor" value={selectedJob.color || "-"} />
          <Detail label="Notatki" value={selectedJob.notes || "-"} />

          <Text style={styles.label}>Zmień status</Text>
          <View style={styles.statusWrap}>
            {statuses.map((status) => (
              <Pressable
                key={status}
                style={[styles.statusChip, selectedJob.status === status && styles.statusChipActive]}
                onPress={() => updateSelectedJob({ status })}
              >
                <Text style={[styles.statusChipText, selectedJob.status === status && styles.statusChipTextActive]}>
                  {status}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Firma ogrodzeniowa</Text>
            <Text style={styles.title}>Zlecenia</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => setIsAdding(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Szukaj klienta, telefonu lub adresu"
          placeholderTextColor="#8b8174"
        />

        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredJobs.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{jobs.length === 0 ? "Brak zleceń" : "Nic nie znaleziono"}</Text>
              <Text style={styles.emptyText}>
                {jobs.length === 0 ? "Dodaj pierwszego klienta przyciskiem plus." : "Zmień wpisaną frazę i spróbuj ponownie."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.jobCard} onPress={() => setSelectedId(item.id)}>
              <View style={styles.jobCardHeader}>
                <Text style={styles.jobName}>{item.clientName}</Text>
                <Text style={styles.jobStatus}>{item.status}</Text>
              </View>
              <Text style={styles.jobMeta}>{item.phone}</Text>
              <Text style={styles.jobAddress}>{item.address}</Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "phone-pad";
  multiline?: boolean;
  onVoicePress?: () => void;
  isListening?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={[styles.inputRow, props.multiline && styles.inputRowMultiline]}>
        <TextInput
          style={[styles.input, props.multiline && styles.inputMultiline]}
          value={props.value}
          onChangeText={props.onChangeText}
          keyboardType={props.keyboardType ?? "default"}
          multiline={props.multiline}
          placeholderTextColor="#8b8174"
        />
        {props.onVoicePress && (
          <Pressable
            style={[styles.voiceButton, props.isListening && styles.voiceButtonActive]}
            onPress={props.onVoicePress}
          >
            <Text style={styles.voiceButtonText}>{props.isListening ? "Stop" : "Mów"}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  screen: {
    flex: 1,
    backgroundColor: "#f4f0e8"
  },
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 16
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  kicker: {
    color: "#6f7f65",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: "#22251f",
    flex: 1,
    fontSize: 30,
    fontWeight: "800"
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#2f6f4e",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "300",
    marginTop: -3
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  iconButtonText: {
    color: "#22251f",
    fontSize: 24,
    fontWeight: "700"
  },
  iconButtonDanger: {
    alignItems: "center",
    backgroundColor: "#f4d8d0",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  iconButtonDangerText: {
    color: "#9b2d1f",
    fontSize: 14,
    fontWeight: "800"
  },
  list: {
    gap: 12,
    paddingBottom: 28
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center"
  },
  emptyBox: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20
  },
  emptyTitle: {
    color: "#22251f",
    fontSize: 22,
    fontWeight: "800"
  },
  emptyText: {
    color: "#6f675e",
    fontSize: 16,
    textAlign: "center"
  },
  jobCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e0d8cd",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 7
  },
  jobCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  jobName: {
    color: "#22251f",
    flex: 1,
    fontSize: 19,
    fontWeight: "800"
  },
  jobStatus: {
    backgroundColor: "#dce8d5",
    borderRadius: 6,
    color: "#2f6f4e",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  jobMeta: {
    color: "#4c4a42",
    fontSize: 16,
    fontWeight: "700"
  },
  jobAddress: {
    color: "#6f675e",
    fontSize: 15
  },
  inputWrap: {
    flex: 1,
    gap: 7
  },
  label: {
    color: "#4c4a42",
    fontSize: 14,
    fontWeight: "800"
  },
  inputRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8
  },
  inputRowMultiline: {
    alignItems: "flex-start"
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d8cec1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#22251f",
    flex: 1,
    fontSize: 17,
    minHeight: 50,
    paddingHorizontal: 12
  },
  voiceButton: {
    alignItems: "center",
    backgroundColor: "#384f6b",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 50,
    width: 64
  },
  voiceButtonActive: {
    backgroundColor: "#b94835"
  },
  voiceButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderColor: "#d8cec1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#22251f",
    fontSize: 17,
    minHeight: 50,
    paddingHorizontal: 14
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  twoColumns: {
    flexDirection: "row",
    gap: 12
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f6f4e",
    borderRadius: 8,
    minHeight: 54,
    justifyContent: "center",
    marginTop: 4
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800"
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#2f6f4e",
    borderRadius: 8,
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 52,
    justifyContent: "center"
  },
  recordingButton: {
    backgroundColor: "#b94835"
  },
  actionButtonDisabled: {
    backgroundColor: "#a9a295"
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  detailBox: {
    backgroundColor: "#ffffff",
    borderColor: "#e0d8cd",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 5
  },
  detailLabel: {
    color: "#6f675e",
    fontSize: 13,
    fontWeight: "800"
  },
  detailValue: {
    color: "#22251f",
    fontSize: 17,
    fontWeight: "700"
  },
  statusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9
  },
  statusChip: {
    backgroundColor: "#ffffff",
    borderColor: "#d8cec1",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  statusChipActive: {
    backgroundColor: "#2f6f4e",
    borderColor: "#2f6f4e"
  },
  statusChipText: {
    color: "#4c4a42",
    fontSize: 14,
    fontWeight: "800"
  },
  statusChipTextActive: {
    color: "#ffffff"
  }
});
