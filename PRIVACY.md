# Privacy

The extension reads the text of the active YAML editor locally to create navigation entries. It does not send document contents to a server, download subscriptions, connect to the Mihomo API, write configuration files, collect telemetry, or save document contents to its own persistent storage.

Short field values may be visible in the sidebar and native Outline. Common credential fields such as password, token, secret, authentication, private-key and uuid are masked. This is a convenience filter, not comprehensive secret detection: values under other keys can still be displayed. Take care when sharing screenshots of a real configuration.

The shipped demo uses localhost and example.com placeholders. No real subscriptions, user configuration, personal screenshots, local user paths or credentials are included in the release.

The email in THIRD_PARTY_NOTICES.txt belongs to the author of the YAML dependency and is included as required by that dependency's license.
