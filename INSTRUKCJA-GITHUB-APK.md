# Budowanie APK przez GitHub

Ta metoda omija problem Windows/Node na Twoim komputerze. APK buduje się na serwerze GitHub.

## 1. Przygotuj paczkę

Uruchom dwuklikiem:

```bash
przygotuj-paczke-github.bat
```

Powstanie plik:

```bash
ogrodzenia-do-github.zip
```

## 2. Wrzuć projekt na GitHub

1. Wejdź na https://github.com/new
2. Utwórz nowe repozytorium, np. `ogrodzenia-app`.
3. W repozytorium wybierz `Add file` -> `Upload files`.
4. Wgraj zawartość pliku `ogrodzenia-do-github.zip`.
5. Zatwierdź przyciskiem `Commit changes`.

## 3. Dodaj token Expo

1. Wejdź na https://expo.dev/settings/access-tokens
2. Utwórz token.
3. W GitHub wejdź w repozytorium -> `Settings` -> `Secrets and variables` -> `Actions`.
4. Dodaj sekret:

```bash
EXPO_TOKEN
```

Jako wartość wklej token z Expo.

## 4. Zbuduj APK

1. W GitHub wejdź w zakładkę `Actions`.
2. Wybierz `Build Android APK`.
3. Kliknij `Run workflow`.
4. Po zakończeniu wejdź w wynik budowania.
5. Pobierz artefakt `ogrodzenia-apk`.

W środku będzie plik `ogrodzenia.apk`, który można zainstalować na telefonie z Androidem.
