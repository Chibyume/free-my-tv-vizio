# Free My TV for Vizio

Experimental static Vizio adaptation of [Free My TV](https://github.com/simbasjungles/free-my-tv), under its MIT license. The original project license is in `LICENSE.txt`.

Open the hosted site through the TV's Conjure launcher (namespace 4, app 17). The adapter uses the Vizio companion library already on the TV at `127.0.0.1:12345`. It does not require a PC control server or contain pairing credentials.

Use the TV remote's arrow keys and OK. Home returns to Vizio. This does not install a permanent home-screen tile, replace the Home button, or start automatically at boot. TV firmware updates may change compatibility. Streaming services still require their normal accounts and subscriptions.

The public build has Camden, NJ weather in Fahrenheit. TMDB recommendations and cryptocurrency prices are disabled. No account credentials, API keys, pairing tokens, or private network addresses are included.

Native app shortcuts come from Vizio's public app catalog. Only YouTube has been live-tested so far. Use the physical remote's Input button to switch inputs.

## Attribution and compatibility references

- Original app: https://github.com/simbasjungles/free-my-tv
- Vizio launcher: https://vizio-pm.s3-us-west-1.amazonaws.com/conjure-launcher.html
- Vizio catalog: https://scfs.vizio.com/appservice/vizio_apps_prod.json
- Launch configurations: https://scfs.vizio.com/appservice/app_availability_prod.json

This is an unofficial adaptation, not a Vizio product.
