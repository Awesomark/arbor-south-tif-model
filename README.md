# Brownfield TIF Tax Model

A static browser app for comparing taxable value and tax collection scenarios for the Arbor South brownfield TIF discussion.

The model compares:

- No improvement
- Proposed TIF, using the city's fixed $473,632,450 improvement value
- User-entered input improvement

Each scenario shows taxable value, annual taxes, and cumulative taxes over 75 years. The proposed TIF section also includes cumulative brownfield taxes captured using the city-proposed taxable-value schedule.

## Run locally

Open `index.html` in a browser, or run a local static server:

```sh
python3 -m http.server 8000
```

Then visit `http://127.0.0.1:8000/`.
