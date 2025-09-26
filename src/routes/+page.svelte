<script lang="ts">
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import {
    Download,
    RefreshCw,
    Gamepad2,
    AlertCircle,
    CheckCircle,
    XCircle,
  } from "lucide-svelte";
  import {
    TauriLauncherDetectionService,
    TauriSteamIntegrationService,
    type LauncherInfo,
  } from "$lib/services/tauri-launcher-detection";
  import { onMount } from "svelte";

  interface LauncherStatus extends LauncherInfo {
    status: "detected" | "not-found" | "scanning" | "importing";
  }

  let launchers: LauncherStatus[] = [];
  let isScanning = false;
  let importedGames = 0;
  let steamService: TauriSteamIntegrationService;
  let detectionService: TauriLauncherDetectionService;
  let steamDetected = false;
  let errorMessage = "";
  let successMessage = "";

  onMount(async () => {
    try {
      steamService = new TauriSteamIntegrationService();
      detectionService = new TauriLauncherDetectionService();

      // Check Steam installation
      const steamPath = await steamService.checkSteamPath();
      steamDetected = steamPath !== null;

      console.log("Services initialized, Steam detected:", steamDetected);

      // Initial scan
      await scanLaunchers();
    } catch (error) {
      console.error("Failed to initialize services:", error);
      errorMessage = `Failed to initialize: ${error}`;
    }
  });

  async function scanLaunchers() {
    if (!detectionService) return;

    isScanning = true;
    errorMessage = "";
    successMessage = "";

    // Set all to scanning state
    if (launchers.length > 0) {
      launchers = launchers.map((launcher) => ({
        ...launcher,
        status: "scanning",
      }));
    }

    try {
      console.log("Starting launcher scan...");
      const detected = await detectionService.detectLaunchers();
      console.log("Scan completed, results:", detected);

      launchers = detected.map((launcher) => ({
        ...launcher,
        status: launcher.detected ? "detected" : "not-found",
      }));

      const detectedCount = launchers.filter((l) => l.detected).length;
      const totalGames = launchers.reduce((sum, l) => sum + l.games.length, 0);

      successMessage = `Found ${detectedCount} launchers with ${totalGames} games total`;
    } catch (error) {
      console.error("Failed to scan launchers:", error);
      errorMessage = `Scan failed: ${error}`;

      // Reset launchers to empty state on error
      launchers = [];
    }

    isScanning = false;
  }

  async function importGames(launcherId: string) {
    const launcherIndex = launchers.findIndex((l) => l.id === launcherId);
    if (launcherIndex === -1 || !launchers[launcherIndex].detected) return;

    if (!steamDetected) {
      errorMessage =
        "Steam is not detected. Please make sure Steam is installed.";
      return;
    }

    launchers[launcherIndex].status = "importing";
    errorMessage = "";
    successMessage = "";

    try {
      console.log(`Starting import for ${launcherId}...`);
      const games = await detectionService.getGamesByLauncher(launcherId);
      console.log(`Got ${games.length} games, importing to Steam...`);

      const result = await steamService.addGamesToSteam(games);
      console.log("Import result:", result);

      importedGames += result.success;

      if (result.failed.length > 0) {
        errorMessage = `Some games failed to import: ${result.failed.join(", ")}`;
      }

      if (result.success > 0) {
        successMessage = `Successfully imported ${result.success} games from ${launchers[launcherIndex].name}`;
      }

      launchers[launcherIndex].status = "detected";
    } catch (error) {
      console.error(`Failed to import games from ${launcherId}:`, error);
      errorMessage = `Failed to import games from ${launchers[launcherIndex].name}: ${error}`;
      launchers[launcherIndex].status = "detected";
    }
  }

  async function importAllGames() {
    if (!steamDetected) {
      errorMessage =
        "Steam is not detected. Please make sure Steam is installed.";
      return;
    }

    errorMessage = "";
    successMessage = "";
    let totalSuccessful = 0;
    let allFailed: string[] = [];

    const detectedLaunchers = launchers.filter((l) => l.detected);

    for (const launcher of detectedLaunchers) {
      try {
        console.log(`Importing from ${launcher.name}...`);
        const games = await detectionService.getGamesByLauncher(launcher.id);
        const result = await steamService.addGamesToSteam(games);

        totalSuccessful += result.success;
        allFailed = [...allFailed, ...result.failed];

        importedGames += result.success;
      } catch (error) {
        console.error(`Failed to import from ${launcher.name}:`, error);
        allFailed.push(`${launcher.name}: ${error}`);
      }
    }

    if (totalSuccessful > 0) {
      successMessage = `Successfully imported ${totalSuccessful} games total`;
    }

    if (allFailed.length > 0) {
      errorMessage = `Some imports failed: ${allFailed.join(", ")}`;
    }
  }

  function clearMessages() {
    errorMessage = "";
    successMessage = "";
  }

  $: totalGamesFound = launchers.reduce((sum, l) => sum + l.games.length, 0);
  $: launchersDetected = launchers.filter((l) => l.detected).length;
</script>

<svelte:head>
  <title>NoMoreLaunchers - Import Games to Steam</title>
  <meta
    name="description"
    content="Import games from multiple launchers into Steam with ease"
  />
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
>
  <div class="container mx-auto p-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1
        class="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3"
      >
        <Gamepad2 class="w-10 h-10 text-blue-400" />
        NoMoreLaunchers
      </h1>
      <p class="text-lg text-slate-300">
        Import games from multiple launchers into Steam
      </p>

      {#if !steamDetected}
        <div
          class="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg inline-flex items-center gap-2"
        >
          <AlertCircle class="w-5 h-5 text-red-400" />
          <span class="text-red-300"
            >Steam not detected - Please install Steam first</span
          >
        </div>
      {/if}
    </div>

    <!-- Messages -->
    {#if errorMessage}
      <div
        class="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3"
      >
        <XCircle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-red-300">{errorMessage}</p>
          <Button
            variant="ghost"
            size="sm"
            class="mt-2 text-red-200 hover:text-red-100"
            on:click={clearMessages}
          >
            Dismiss
          </Button>
        </div>
      </div>
    {/if}

    {#if successMessage}
      <div
        class="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3"
      >
        <CheckCircle class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-green-300">{successMessage}</p>
          <Button
            variant="ghost"
            size="sm"
            class="mt-2 text-green-200 hover:text-green-100"
            on:click={clearMessages}
          >
            Dismiss
          </Button>
        </div>
      </div>
    {/if}

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card class="bg-slate-800/50 border-slate-700">
        <CardContent class="p-6">
          <div class="text-2xl font-bold text-white">{launchersDetected}</div>
          <p class="text-slate-400">Launchers Detected</p>
        </CardContent>
      </Card>
      <Card class="bg-slate-800/50 border-slate-700">
        <CardContent class="p-6">
          <div class="text-2xl font-bold text-white">{totalGamesFound}</div>
          <p class="text-slate-400">Games Found</p>
        </CardContent>
      </Card>
      <Card class="bg-slate-800/50 border-slate-700">
        <CardContent class="p-6">
          <div class="text-2xl font-bold text-white">{importedGames}</div>
          <p class="text-slate-400">Games Imported</p>
        </CardContent>
      </Card>
    </div>

    <!-- Actions -->
    <div class="flex gap-4 mb-8 justify-center">
      <Button
        variant="outline"
        size="lg"
        on:click={scanLaunchers}
        disabled={isScanning}
        class="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
      >
        {#if isScanning}
          <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
          Scanning...
        {:else}
          <RefreshCw class="w-4 h-4 mr-2" />
          Scan Launchers
        {/if}
      </Button>

      <Button
        size="lg"
        on:click={importAllGames}
        disabled={launchersDetected === 0 || !steamDetected}
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600"
      >
        <Download class="w-4 h-4 mr-2" />
        Import All Games
      </Button>
    </div>

    <!-- Launchers Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each launchers as launcher}
        <Card
          class="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors"
        >
          <CardHeader>
            <CardTitle class="text-white flex items-center gap-3">
              <span class="text-2xl">{launcher.icon}</span>
              {launcher.name}
            </CardTitle>
            <CardDescription class="text-slate-400">
              {#if launcher.status === "scanning"}
                <span class="flex items-center gap-2">
                  <RefreshCw class="w-4 h-4 animate-spin" />
                  Scanning...
                </span>
              {:else if launcher.status === "importing"}
                <span class="flex items-center gap-2 text-blue-400">
                  <Download class="w-4 h-4 animate-pulse" />
                  Importing games...
                </span>
              {:else if launcher.detected}
                <span class="text-green-400 flex items-center gap-2">
                  <CheckCircle class="w-4 h-4" />
                  {launcher.games.length} games found
                </span>
              {:else}
                <span class="text-red-400 flex items-center gap-2">
                  <XCircle class="w-4 h-4" />
                  Not detected
                </span>
              {/if}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant={launcher.detected ? "default" : "outline"}
              class="w-full {launcher.detected
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'border-slate-600 text-slate-400'}"
              disabled={!launcher.detected ||
                launcher.status === "importing" ||
                !steamDetected}
              on:click={() => importGames(launcher.id)}
            >
              {#if launcher.status === "importing"}
                <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                Importing...
              {:else if launcher.detected}
                <Download class="w-4 h-4 mr-2" />
                Import {launcher.games.length} Games
              {:else}
                Not Available
              {/if}
            </Button>
          </CardContent>
        </Card>
      {/each}
    </div>

    {#if launchers.length === 0 && !isScanning}
      <div class="text-center py-12">
        <p class="text-slate-400 text-lg mb-4">No launchers scanned yet</p>
        <Button on:click={scanLaunchers} class="bg-blue-600 hover:bg-blue-700">
          <RefreshCw class="w-4 h-4 mr-2" />
          Start Scanning
        </Button>
      </div>
    {/if}

    <!-- Footer -->
    <div class="text-center mt-12 text-slate-500">
      <p>
        Inspired by NonSteamLaunchers for Steam Deck • Built for Windows with
        Tauri
      </p>
      <p class="text-sm mt-2">Run as Administrator for full functionality</p>
    </div>
  </div>
</div>
