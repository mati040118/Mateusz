# Ogrodzenia

Pierwsza lokalna wersja aplikacji mobilnej dla firmy wykonującej ogrodzenia.

## Co jest gotowe

- Lista zleceń zapisywana lokalnie na telefonie.
- Dodawanie i edycja danych klienta.
- Telefon, adres, wymiary, typ ogrodzenia, brama, furtka, kolor, notatki i status.
- Wyszukiwanie po kliencie, telefonie, adresie albo statusie.
- Wpisywanie danych głosem w formularzu.
- Przycisk dzwonienia do klienta.
- Przycisk otwierania trasy w Google Maps.
- Nagrywanie i odtwarzanie notatki głosowej do zlecenia.

## Uruchomienie robocze

Na komputerze można uruchomić podgląd Expo:

```bash
npm run start
```

Na telefonie należy zainstalować Expo Go i zeskanować kod QR z terminala.

W Expo Go można używać mikrofonu z klawiatury telefonu. Pełny przycisk „Mów” z rozpoznawaniem mowy wymaga instalowanej wersji aplikacji, ponieważ korzysta z natywnego modułu telefonu.

## Wersja bez komputera

Żeby korzystać z aplikacji normalnie, bez uruchamiania komputera, trzeba przygotować instalowaną wersję:

- Android: plik APK/AAB.
- iPhone: TestFlight albo App Store, zwykle z kontem Apple Developer.

Ta wersja aplikacji przechowuje dane lokalnie na telefonie. Synchronizację między pracownikami można dodać później.

## Budowanie instalowanej wersji

Najprościej zacząć od Androida.

Jeżeli logowanie do Expo nie pojawi się automatycznie, uruchom:

```bash
zaloguj-do-expo.bat
```

Jeżeli logowanie hasłem w terminalu nie działa, użyj logowania przez przeglądarkę z pliku `zaloguj-do-expo.bat`. Awaryjnie można też utworzyć token na stronie Expo i uruchomić `zbuduj-android-apk-token.bat`.

Android APK do ręcznej instalacji:

```bash
npm run build:android:apk
```

Pierwsze uruchomienie poprosi o zalogowanie do Expo. Jeżeli EAS zapyta o utworzenie projektu albo wygenerowanie kluczy podpisu Android, potwierdź. Po zakończeniu EAS pokaże link do pobrania pliku APK. Ten plik można pobrać na telefon z Androidem i zainstalować.

Możesz też uruchomić dwuklikiem:

```bash
zbuduj-android-apk.bat
```

Jeżeli budowanie nie rusza mimo poprawnego logowania, uruchom:

```bash
sprawdz-budowanie.bat
```

Jeżeli pojawi się komunikat, że Windows blokuje uruchamianie procesów z Node, uruchom plik budowania normalnie dwuklikiem poza Codexem albo jako administrator. Gdy problem zostanie, zainstaluj Node.js LTS ze strony nodejs.org i spróbuj ponownie.

Jeżeli lokalne budowanie dalej nie działa, użyj metody przez GitHub z pliku `INSTRUKCJA-GITHUB-APK.md`. Ta metoda buduje APK na serwerze i omija problem Windows/Node.

iPhone:

```bash
npm run build:ios:preview
```

Do iPhone'a potrzebne jest konto Apple Developer. Najwygodniejsza droga dla codziennego używania to TestFlight albo później App Store. Wersje wewnętrzne na iPhone wymagają też zarejestrowania urządzenia albo dystrybucji przez TestFlight.
