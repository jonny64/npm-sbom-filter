#!/usr/bin/env node
// Usage: node sbom-filter.js <sbom.json> <pkg1> <pkg2> ...
// Filters SBOM to components reachable from given root packages (by name or @scope/name)

const fs = require ('fs')

function filterSbom (sbom, roots) {
    const rootRefs = sbom.components
        .filter (c => roots.some (r => {
            if (r.startsWith ('@')) {
                const encoded = 'pkg:npm/%40' + r.slice (1).replace ('/', '%2F')
                return c.purl && c.purl.startsWith (encoded + '@')
            }
            return c.name === r
        }))
        .map (c => c ['bom-ref'])

    if (!rootRefs.length)
        throw new Error ('No components found for: ' + roots.join (', '))

    const depMap = {}
    for (const d of sbom.dependencies)
        depMap [d.ref] = d.dependsOn || []

    const visited = new Set ()
    function walk (ref) {
        if (visited.has (ref)) return
        visited.add (ref)
        for (const dep of depMap [ref] || []) walk (dep)
    }
    for (const ref of rootRefs) walk (ref)

    return {
        ...sbom,
        components   : sbom.components.filter (c => visited.has (c ['bom-ref'])),
        dependencies : sbom.dependencies
            .filter (d => visited.has (d.ref))
            .map    (d => ({ ...d, dependsOn: (d.dependsOn || []).filter (r => visited.has (r)) })),
    }
}

if (require.main === module) {
    const [,, sbomPath, ...roots] = process.argv

    if (!sbomPath || !roots.length) {
        console.error ('Usage: npx npm-sbom-filter <sbom.json> <pkg1> <pkg2> ...')
        process.exit (1)
    }

    const sbom = JSON.parse (fs.readFileSync (sbomPath))

    try {
        process.stdout.write (JSON.stringify (filterSbom (sbom, roots), null, 2))
    } catch (e) {
        console.error (e.message)
        process.exit (1)
    }
}

module.exports = { filterSbom }
