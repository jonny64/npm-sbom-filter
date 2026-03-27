# sbom-filter

Filter a CycloneDX JSON SBOM to only components reachable from given root packages

## Usage

```
npx sbom-filter <sbom.json> <pkg1> <pkg2> ...
```

Scoped packages are supported:

```
npx sbom-filter sbom-front.json vue pinia @vuepic/vue-datepicker > sbom-vuejs.json
```

Output is written to stdout.

## How it works

1. Finds root components by name or `@scope/name` (matched via purl)
2. Walks the `dependencies` graph recursively from each root
3. Filters `components` and `dependencies` to only reachable entries

