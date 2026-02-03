import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { generateGraphData, generateSerializedGraphData } from '@/lib/graph/generate'
import { NODE_COLORS, NODE_SIZES, type NodeType } from '@/lib/graph/types'

// ============================================
// Basic graph structure tests
// ============================================

describe('generateGraphData structure', () => {
  test('returns nodes and edges arrays', () => {
    const data = generateGraphData()
    assert.ok(Array.isArray(data.nodes))
    assert.ok(Array.isArray(data.edges))
  })

  test('graph has at least some nodes', () => {
    const { nodes } = generateGraphData()
    assert.ok(nodes.length > 0, 'Graph should have at least one node')
  })

  test('all nodes have required properties', () => {
    const { nodes } = generateGraphData()
    for (const node of nodes) {
      assert.ok(typeof node.id === 'string', 'Node should have string id')
      assert.ok(typeof node.label === 'string', 'Node should have string label')
      assert.ok(typeof node.type === 'string', 'Node should have string type')
      assert.ok(typeof node.url === 'string', 'Node should have string url')
      assert.ok(typeof node.size === 'number', 'Node should have number size')
      assert.ok(typeof node.color === 'string', 'Node should have string color')
    }
  })

  test('all edges have required properties', () => {
    const { edges } = generateGraphData()
    for (const edge of edges) {
      assert.ok(typeof edge.id === 'string', 'Edge should have string id')
      assert.ok(typeof edge.source === 'string', 'Edge should have string source')
      assert.ok(typeof edge.target === 'string', 'Edge should have string target')
      assert.ok(typeof edge.type === 'string', 'Edge should have string type')
      assert.ok(typeof edge.weight === 'number', 'Edge should have number weight')
    }
  })
})

// ============================================
// Node type tests
// ============================================

describe('graph node types', () => {
  test('graph note nodes link to /notes#<slug>', () => {
    const { nodes } = generateGraphData()
    const noteNodes = nodes.filter((node) => node.type === 'note')

    assert.ok(noteNodes.length > 0)

    for (const node of noteNodes) {
      assert.ok(node.url.startsWith('/notes#'))
      assert.ok(!node.url.startsWith('/notes/'))
    }
  })

  test('essay nodes link to /writing/<slug>', () => {
    const { nodes } = generateGraphData()
    const essayNodes = nodes.filter((node) => node.type === 'essay')

    // May have no essays in test data
    for (const node of essayNodes) {
      assert.ok(node.url.startsWith('/writing/'))
      assert.ok(!node.url.includes('#'))
    }
  })

  test('book nodes link to /library#<id>', () => {
    const { nodes } = generateGraphData()
    const bookNodes = nodes.filter((node) => node.type === 'book')

    assert.ok(bookNodes.length > 0, 'Should have book nodes')

    for (const node of bookNodes) {
      assert.ok(node.url.startsWith('/library#'))
    }
  })

  test('tag nodes link to /topics/<tag>', () => {
    const { nodes } = generateGraphData()
    const tagNodes = nodes.filter((node) => node.type === 'tag')

    // Tags are created when content has tags
    for (const node of tagNodes) {
      assert.ok(node.url.startsWith('/topics/'))
    }
  })

  test('node IDs are prefixed by type', () => {
    const { nodes } = generateGraphData()

    for (const node of nodes) {
      switch (node.type) {
        case 'essay':
          assert.ok(node.id.startsWith('essay-'))
          break
        case 'note':
          assert.ok(node.id.startsWith('note-'))
          break
        case 'book':
          assert.ok(node.id.startsWith('book-'))
          break
        case 'tag':
          assert.ok(node.id.startsWith('tag-'))
          break
      }
    }
  })
})

// ============================================
// Node styling tests
// ============================================

describe('graph node styling', () => {
  test('nodes use correct colors from NODE_COLORS', () => {
    const { nodes } = generateGraphData()

    for (const node of nodes) {
      const expectedColor = NODE_COLORS[node.type as NodeType]
      if (expectedColor) {
        assert.equal(node.color, expectedColor, `${node.type} should have color ${expectedColor}`)
      }
    }
  })

  test('nodes use correct sizes from NODE_SIZES', () => {
    const { nodes } = generateGraphData()

    for (const node of nodes) {
      const expectedSize = NODE_SIZES[node.type as NodeType]
      if (expectedSize) {
        assert.equal(node.size, expectedSize, `${node.type} should have size ${expectedSize}`)
      }
    }
  })
})

// ============================================
// Edge tests
// ============================================

describe('graph edges', () => {
  test('edge IDs follow source-target pattern', () => {
    const { edges } = generateGraphData()

    for (const edge of edges) {
      assert.equal(edge.id, `${edge.source}-${edge.target}`)
    }
  })

  test('edges reference existing nodes', () => {
    const { nodes, edges } = generateGraphData()
    const nodeIds = new Set(nodes.map((n) => n.id))

    for (const edge of edges) {
      assert.ok(nodeIds.has(edge.source), `Edge source ${edge.source} should exist in nodes`)
      assert.ok(nodeIds.has(edge.target), `Edge target ${edge.target} should exist in nodes`)
    }
  })

  test('tag edges connect content to tags', () => {
    const { edges } = generateGraphData()
    const tagEdges = edges.filter((e) => e.type === 'tag')

    for (const edge of tagEdges) {
      assert.ok(edge.target.startsWith('tag-'), 'Tag edge target should be a tag node')
      assert.ok(
        edge.source.startsWith('essay-') ||
          edge.source.startsWith('note-') ||
          edge.source.startsWith('transmission-'),
        'Tag edge source should be essay, note, or transmission'
      )
    }
  })

  test('topic edges connect books to tags', () => {
    const { edges } = generateGraphData()
    const topicEdges = edges.filter((e) => e.type === 'topic')

    for (const edge of topicEdges) {
      assert.ok(edge.target.startsWith('tag-'), 'Topic edge target should be a tag node')
      assert.ok(edge.source.startsWith('book-'), 'Topic edge source should be a book node')
    }
  })

  test('reference edges have weight >= 2 (shared tags threshold)', () => {
    const { edges } = generateGraphData()
    const referenceEdges = edges.filter((e) => e.type === 'reference')

    for (const edge of referenceEdges) {
      assert.ok(edge.weight >= 2, 'Reference edges require at least 2 shared tags')
    }
  })

  test('reference edges connect non-tag nodes only', () => {
    const { edges } = generateGraphData()
    const referenceEdges = edges.filter((e) => e.type === 'reference')

    for (const edge of referenceEdges) {
      assert.ok(!edge.source.startsWith('tag-'), 'Reference source should not be a tag')
      assert.ok(!edge.target.startsWith('tag-'), 'Reference target should not be a tag')
    }
  })
})

// ============================================
// Node metadata tests
// ============================================

describe('graph node metadata', () => {
  test('essay nodes have metadata with date and summary', () => {
    const { nodes } = generateGraphData()
    const essayNodes = nodes.filter((n) => n.type === 'essay')

    for (const node of essayNodes) {
      assert.ok(node.meta, 'Essay nodes should have meta')
      assert.ok(typeof node.meta.date === 'string', 'Essay should have date')
      assert.ok(typeof node.meta.summary === 'string', 'Essay should have summary')
    }
  })

  test('book nodes have metadata with author', () => {
    const { nodes } = generateGraphData()
    const bookNodes = nodes.filter((n) => n.type === 'book')

    for (const node of bookNodes) {
      assert.ok(node.meta, 'Book nodes should have meta')
      assert.ok(typeof node.meta.author === 'string', 'Book should have author')
    }
  })

  test('note nodes have metadata with date', () => {
    const { nodes } = generateGraphData()
    const noteNodes = nodes.filter((n) => n.type === 'note')

    for (const node of noteNodes) {
      assert.ok(node.meta, 'Note nodes should have meta')
      assert.ok(typeof node.meta.date === 'string', 'Note should have date')
    }
  })

  test('tag nodes do not have metadata', () => {
    const { nodes } = generateGraphData()
    const tagNodes = nodes.filter((n) => n.type === 'tag')

    for (const node of tagNodes) {
      assert.equal(node.meta, undefined, 'Tag nodes should not have meta')
    }
  })
})

// ============================================
// Serialization tests
// ============================================

describe('generateSerializedGraphData', () => {
  test('returns valid JSON string', () => {
    const serialized = generateSerializedGraphData()
    assert.doesNotThrow(() => JSON.parse(serialized))
  })

  test('parsed data matches generateGraphData output', () => {
    const direct = generateGraphData()
    const parsed = JSON.parse(generateSerializedGraphData())

    assert.deepEqual(parsed.nodes.length, direct.nodes.length)
    assert.deepEqual(parsed.edges.length, direct.edges.length)
  })
})

// ============================================
// Uniqueness tests
// ============================================

describe('graph data integrity', () => {
  test('node IDs are unique', () => {
    const { nodes } = generateGraphData()
    const ids = nodes.map((n) => n.id)
    const uniqueIds = [...new Set(ids)]
    assert.equal(ids.length, uniqueIds.length, 'All node IDs should be unique')
  })

  test('edge IDs are unique', () => {
    const { edges } = generateGraphData()
    const ids = edges.map((e) => e.id)
    const uniqueIds = [...new Set(ids)]
    assert.equal(ids.length, uniqueIds.length, 'All edge IDs should be unique')
  })

  test('no self-referencing edges', () => {
    const { edges } = generateGraphData()
    for (const edge of edges) {
      assert.notEqual(edge.source, edge.target, 'Edge should not connect node to itself')
    }
  })
})
