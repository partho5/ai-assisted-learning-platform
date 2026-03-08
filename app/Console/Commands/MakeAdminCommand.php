<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MakeAdminCommand extends Command
{
    protected $signature = 'app:make-admin {--email= : Email of existing user to promote}';

    protected $description = 'Promote an existing user to admin, or create a new admin account';

    public function handle(): int
    {
        $email = $this->option('email') ?? $this->ask('Email address');

        $user = User::where('email', $email)->first();

        if ($user) {
            if ($user->role === UserRole::Admin) {
                $this->info("User [{$email}] is already an admin.");

                return self::SUCCESS;
            }

            $user->update(['role' => UserRole::Admin]);
            $this->info("Promoted [{$email}] to admin.");

            return self::SUCCESS;
        }

        $this->info("No user found with email [{$email}]. Creating a new admin account.");

        $name = $this->ask('Full name');
        $password = $this->secret('Password');

        User::create([
            'name' => $name,
            'username' => Str::slug($name).'-'.Str::random(4),
            'email' => $email,
            'password' => Hash::make($password),
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);

        $this->info("Admin account created for [{$email}].");

        return self::SUCCESS;
    }
}
