import { CityScene } from './components/CityScene';
import { AboutPage } from './ui/AboutPage';
import { GameHud } from './ui/GameHud';
import { MainMenu } from './ui/MainMenu';
import { NewCityPanel } from './ui/NewCityPanel';
import { SaveLoadPanel } from './ui/SaveLoadPanel';
import { useGameController } from './ui/useGameController';

export default function App() {
  const controller = useGameController();

  if (!controller.game) {
    return (
      <>
        {controller.page === 'about' ? (
          <AboutPage onBack={() => controller.setPage('menu')} onNewGame={controller.askForNewCityName} />
        ) : (
          <MainMenu
            onNewGame={controller.askForNewCityName}
            onResume={controller.resume}
            onLoad={controller.openSaves}
            onAbout={() => controller.setPage('about')}
            canResume={controller.saves.length > 0}
          />
        )}
        {controller.showNewCity && (
          <NewCityPanel
            cityName={controller.cityNameDraft}
            onCityNameChange={controller.setCityNameDraft}
            onCreate={controller.startNewGame}
            onClose={() => controller.setShowNewCity(false)}
          />
        )}
        {controller.showSaves && (
          <SaveLoadPanel saves={controller.saves} onLoad={controller.loadSave} onClose={() => controller.setShowSaves(false)} />
        )}
      </>
    );
  }

  return (
    <main className="game-shell">
      <CityScene
        game={controller.game}
        isRoadTool={controller.selectedTool === 'road'}
        onTileSelected={controller.handleTileSelected}
        onRoadLineSelected={controller.handleRoadLineSelected}
      />
      <GameHud
        game={controller.game}
        stats={controller.stats}
        selectedTool={controller.selectedTool}
        message={controller.message}
        statsOpen={controller.statsOpen}
        bankOpen={controller.bankOpen}
        onSave={controller.handleSave}
        onLoad={controller.openSaves}
        onMenu={() => controller.setGame(undefined)}
        onSelectTool={controller.setSelectedTool}
        onToggleStats={() => controller.setStatsOpen((open) => !open)}
        onToggleBank={() => controller.setBankOpen((open) => !open)}
        onBorrow={controller.handleBorrow}
        onRepay={controller.handleRepay}
      />
      {controller.showSaves && (
        <SaveLoadPanel saves={controller.saves} onLoad={controller.loadSave} onClose={() => controller.setShowSaves(false)} />
      )}
    </main>
  );
}
