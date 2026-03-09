<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'role' => ['required', Rule::enum(UserRole::class), Rule::notIn([UserRole::Admin->value])],
        ])->validate();

        // Store guest chat ID in session so the Registered listener can merge history
        if (! empty($input['guest_user_id'])) {
            session()->put('merge_guest_chat_id', $input['guest_user_id']);
        }

        return User::create([
            'name' => $input['name'],
            'username' => $this->generateUsername($input['name']),
            'email' => $input['email'],
            'password' => $input['password'],
            'role' => $input['role'],
        ]);
    }

    private function generateUsername(string $name): string
    {
        $base = Str::slug($name);
        $username = $base;
        $counter = 1;

        while (User::query()->where('username', $username)->exists()) {
            $username = $base.'-'.$counter;
            $counter++;
        }

        return $username;
    }
}
