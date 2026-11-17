<?php

namespace App\Filament\Pages;

use App\Services\PremiumConfiguration;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Validation\ValidationException;

/** @property-read Schema $form */
class Gameplay extends Page
{
    protected string $view = 'filament.pages.gameplay';

    protected static ?string $title = 'Gameplay · Premium';

    /** @var array<string,mixed>|null */
    public ?array $data = [];

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public function mount(): void
    {
        $this->form->fill(app(PremiumConfiguration::class)->current());
    }

    public function form(Schema $schema): Schema
    {
        $consumables = [];
        foreach (['healing_potion' => 'Healing Potion', 'movement_boost' => 'Movement Speed Boost', 'damage_boost' => 'Damage Boost'] as $id => $name) {
            $fields = [Toggle::make("consumables.$id.enabled")->label('Enabled')];
            if ($id === 'healing_potion') {
                $fields[] = TextInput::make("consumables.$id.heal_basis_points")->label('Healing, basis points (3000 = 30%)')->integer()->required()->minValue(1)->maxValue(10000);
            } else {
                $fields[] = TextInput::make("consumables.$id.multiplier_basis_points")->label('Multiplier, basis points (15000 = ×1.5)')->integer()->required()->minValue(1)->maxValue(30000);
                $fields[] = TextInput::make("consumables.$id.duration_ms")->label('Duration, ms of simulation time')->integer()->required()->minValue(1)->maxValue(120000);
            }
            $consumables[] = Section::make($name)->schema($fields);
        }

        return $schema->components([
            Section::make('New runs · previous prices and effects remain in the start snapshot')->schema([
                Toggle::make('enabled')->label('Token-paid actions enabled'),
                Toggle::make('reroll_enabled')->label('Skill Reroll'),
                Toggle::make('resurrection_enabled')->label('Resurrection'),
                TextInput::make('reroll_price')->label('Reroll, Tokens')->integer()->required()->minValue(1)->maxValue(1000000),
                TextInput::make('resurrection_price')->label('Resurrection, Tokens · same price as Shop Revive')->integer()->required()->minValue(1)->maxValue(1000000),
                TextInput::make('revive_limit')->label('Revives per run')->integer()->required()->minValue(0)->maxValue(3),
                TextInput::make('revive_health_basis_points')->label('HP after revive, basis points')->integer()->required()->minValue(1)->maxValue(10000),
                TextInput::make('revive_protection_ms')->label('Protection after revive, ms')->integer()->required()->minValue(0)->maxValue(10000),
            ]),
            ...$consumables,
        ])->statePath('data');
    }

    public function save(): void
    {
        abort_unless(static::canAccess(), 403);
        $state = $this->form->getState();
        try {
            app(PremiumConfiguration::class)->update($state);
        } catch (ValidationException $error) {
            $messages = [];
            foreach ($error->errors() as $key => $errors) {
                $messages['data.'.$key] = $errors;
            }
            throw ValidationException::withMessages($messages);
        }
        Notification::make()->title('Settings saved for new runs')->success()->send();
    }
}
