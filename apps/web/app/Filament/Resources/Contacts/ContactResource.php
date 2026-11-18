<?php

namespace App\Filament\Resources\Contacts;

use App\Filament\Resources\Contacts\Pages\ListContacts;
use App\Filament\Resources\Contacts\Pages\ViewContact;
use App\Models\ContactMessage;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\ViewEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ContactResource extends Resource
{
    protected static ?string $model = ContactMessage::class;

    protected static ?string $slug = 'contact';

    protected static ?string $navigationLabel = 'Contact';

    protected static ?string $modelLabel = 'contact message';

    protected static ?string $pluralModelLabel = 'Contact messages';

    protected static ?string $recordTitleAttribute = 'subject';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedEnvelope;

    // Let Laravel deny abilities that are absent from the read-only policy.
    protected static bool $shouldCheckPolicyExistence = false;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('subject')->searchable()->limit(70),
                TextColumn::make('name')->label('Sender')->searchable(),
                TextColumn::make('email')->searchable(),
                TextColumn::make('created_at')->label('Received')->dateTime()->sortable(),
            ])
            ->recordActions([ViewAction::make()])
            ->defaultSort('id', 'desc');
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema->columns(2)->components([
            TextEntry::make('subject')->columnSpanFull(),
            TextEntry::make('name')->label('Sender'),
            TextEntry::make('email'),
            TextEntry::make('created_at')->label('Received')->dateTime(),
            ViewEntry::make('message')->view('filament.contact-message')->columnSpanFull(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListContacts::route('/'),
            'view' => ViewContact::route('/{record}'),
        ];
    }
}
