<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PortfolioLandingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('portfolio-landing');
    }
}
