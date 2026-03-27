const { describe, it } = require ('node:test')
const assert = require ('assert')
const { filterSbom } = require ('../index')

const sbom = {
    bomFormat   : 'CycloneDX',
    specVersion : '1.4',
    components  : [
        { name: 'plain-pkg',    'bom-ref': 'plain-pkg@1.0.0',        purl: 'pkg:npm/plain-pkg@1.0.0' },
        { name: 'child',        'bom-ref': 'child@1.0.0',            purl: 'pkg:npm/child@1.0.0' },
        { name: 'scoped',       'bom-ref': '@scope/scoped@2.0.0',    purl: 'pkg:npm/%40scope%2Fscoped@2.0.0' },
        { name: 'unrelated',    'bom-ref': 'unrelated@1.0.0',        purl: 'pkg:npm/unrelated@1.0.0' },
    ],
    dependencies: [
        { ref: 'plain-pkg@1.0.0',     dependsOn: ['child@1.0.0'] },
        { ref: 'child@1.0.0',         dependsOn: [] },
        { ref: '@scope/scoped@2.0.0', dependsOn: [] },
        { ref: 'unrelated@1.0.0',     dependsOn: [] },
    ],
}

describe ('filterSbom', () => {
    it ('includes scoped package matched by %2F-encoded purl', () => {
        const result = filterSbom (sbom, ['@scope/scoped'])
        const names = result.components.map (c => c.name)
        assert.deepStrictEqual (names, ['scoped'])
    })

    it ('excludes unrelated components', () => {
        const result = filterSbom (sbom, ['plain-pkg'])
        const names = result.components.map (c => c.name)
        assert.ok (!names.includes ('unrelated'))
        assert.ok (!names.includes ('scoped'))
    })

    it ('includes transitive deps', () => {
        const result = filterSbom (sbom, ['plain-pkg'])
        const names = result.components.map (c => c.name)
        assert.deepStrictEqual (names, ['plain-pkg', 'child'])
    })

    it ('throws when root package not found', () => {
        assert.throws (() => filterSbom (sbom, ['no-such-pkg']), /No components found/)
    })

    it ('treats missing dependencies as an empty graph', () => {
        const result = filterSbom ({
            bomFormat   : 'CycloneDX',
            specVersion : '1.4',
            components  : [
                { name: 'plain-pkg', 'bom-ref': 'plain-pkg@1.0.0', purl: 'pkg:npm/plain-pkg@1.0.0' },
            ],
        }, ['plain-pkg'])

        assert.deepStrictEqual (result.components, [
            { name: 'plain-pkg', 'bom-ref': 'plain-pkg@1.0.0', purl: 'pkg:npm/plain-pkg@1.0.0' },
        ])
        assert.deepStrictEqual (result.dependencies, [])
    })
})
