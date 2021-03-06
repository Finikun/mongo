// @tags: [
//   # mapReduce does not support afterClusterTime.
//   does_not_support_causal_consistency,
//   does_not_support_stepdowns,
//   uses_map_reduce_with_temp_collections,
// ]

load("jstests/libs/fixture_helpers.js");  // For FixtureHelpers.

// Do not execute new path on the passthrough suites.
if (!FixtureHelpers.isMongos(db)) {
    assert.commandWorked(db.adminCommand({setParameter: 1, internalQueryUseAggMapReduce: true}));
}

t = db.mr_index;
t.drop();

outName = "mr_index_out";
out = db[outName];
out.drop();

t.insert({tags: [1]});
t.insert({tags: [1, 2]});
t.insert({tags: [1, 2, 3]});
t.insert({tags: [3]});
t.insert({tags: [2, 3]});
t.insert({tags: [2, 3]});
t.insert({tags: [1, 2]});

m = function() {
    for (i = 0; i < this.tags.length; i++)
        emit(this.tags[i], 1);
};

r = function(k, vs) {
    return Array.sum(vs);
};

ex = function() {
    return out.find().sort({value: 1}).explain("executionStats");
};

res = t.mapReduce(m, r, {out: outName});

assert.eq(3, ex().executionStats.nReturned, "A1");
out.ensureIndex({value: 1});
assert.eq(3, ex().executionStats.nReturned, "A2");

res = t.mapReduce(m, r, {out: outName});

assert.eq(3, ex().executionStats.nReturned, "B1");
res.drop();

assert.commandWorked(db.adminCommand({setParameter: 1, internalQueryUseAggMapReduce: false}));
