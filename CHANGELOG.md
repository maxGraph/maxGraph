# `maxGraph` Change Log

## UNRELEASED

**Breaking Changes**
- In `StencilShape`, the `allowEval` and `defaultLocalized` static properties have been removed. Configure these properties using `StencilShapeConfig`. 
- Logs are no longer sent to `MaxLog` by default. To restore the previous behavior, change maxGraph's global configuration with:
```js
GlobalConfig.logger = new MaxLogAsLogger();
```
- `MaxWindow.activeWindow` is no longer available; it was intended for internal use only, so there's no reason to make it public.
- The signature of `cellArrayUtils.getOpposites` has changed. It now returns an array and take an edges Cell array parameter.
Previously it was returning a function and this was an extra indirection. This is now simpler to use and match the signature of the mxGraph function.
- `cellArrayUtils.restoreClone` is no longer available. It was intended to be private.
- The signature of `cellArrayUtils.cloneCells` has changed. It now returns an array of Cells instead of a function. 

## 0.10.3

Release date: `2024-05-29`

For more details, see the [0.10.3 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.10.3) on the GitHub release page.

This release contains bug fixes.

## 0.10.2

Release date: `2024-05-24`

For more details, see the [0.10.2 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.10.2) on the GitHub release page.

This release contains bug fixes.

## 0.10.1

Release date: `2024-04-23`

For more details, see the [0.10.1 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.10.1) on the GitHub release page.

This release contains documentation improvements and bug fixes.

## 0.10.0

Release date: `2024-04-19`

For more details, see the [0.10.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.10.0) on the GitHub release page.

This release contains enhancements, documentation improvements and bug fixes.

## 0.9.0

Release date: `2024-04-08`

For more details, see the [0.9.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.9.0) on the GitHub release page.

This release contains documentation improvements and bug fixes.

**Breaking Changes**
- it is no longer possible to pass a 'n' value for the `max` property of the `Multiplicity` class. Pass `null` instead to have the same effect.

## 0.8.0

Release date: `2024-02-14`

For more details, see the [0.8.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.8.0) on the GitHub release page.

This release contains new features and bug fixes.

**Breaking Changes**
They mainly impacts TypeScript users and impacts are limited:
- rename the `StyleArrayValue` type into `StyleArrowValue`.
This only has an impact on TypeScript users who use this type explicitly, which should happen rarely.
- `Perimeter` is no longer a class but a value object. This only impact users that had extended the
`Perimeter` class. Regular user that define perimeter style properties using function provided by
 `maxGraph` are not impacted by this change.
- `CellState.perimeter` no longer accept `Function`, but only the `PerimeterFunction`.
  - Passing an arbitrary `Function` was incorrect and always failed at runtime.
  - This change should not impact people using working implementation of perimeter function
  (including these provided by maxGraph) as they already have the right signature. Implementers of
  custom perimeter in TypeScript may have to slightly update their perimeter function declaration.
- `CellStateStyle.loopStyle` no longer accept `Function`, but only the `EdgeStyleFunction` (limited impacts like on the `perimeter` property) 
- `Graph.createEdgeHandler` only accepts `EdgeStyleFunction` for the `edgeStyle` parameter.
- `GraphView` signature method changes
  - `getPerimeterPoint` can now return `null`
  - `getPerimeterBounds` no longer accept null `CellState` and no longer returns `null`
- Some internal methods of `EdgeStyle` are no longer available:
  - `scaleCellState`
  - `scalePointArray`


## 0.7.0

Release date: `2024-01-20`

This release contains new features and bug fixes.

For more details, see the [0.7.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.7.0) on the GitHub release page.

## 0.6.0

Release date: `2023-12-22`

**Breaking Changes**
- Codecs supplied by `maxGraph` are no longer registered by default. They **MUST** be registered before performing an `encode` or `decode`.
You can use one of the following functions to register codecs: 
  - `registerAllCodecs`
  - `registerCoreCodecs`
  - `registerEditorCodecs`

To serialize the `maxGraph` model, you can use the `ModelXmlSerializer` class, which registers codecs under the hood.

For more details, see the [0.6.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.6.0) on the GitHub release page.

## 0.5.0

Release date: `2023-12-07`

This release contains new features, bug fixes and documentation improvements.

**Breaking Changes**
- the UMD bundle is no more provided in the npm package.

For more details, see the [0.5.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.5.0) on the GitHub release page.

## 0.4.1

Release date: `2023-10-30`

This release contains bug fixes and internal improvements.

For more details, see the [0.4.1 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.4.1) on
the GitHub release page.

## 0.4.0

Release date: `2023-09-14`

This release contains new features, bug fixes and documentation improvements.

**Major improvements**
- introduce the Manhattan connector

For more details, see the [0.4.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.4.0) on
the GitHub release page.

## 0.3.0

Release date: `2023-07-07`

This release contains new features, bug fixes and documentation improvements.

**Breaking Changes**
- types: `Stylesheet.getDefaultVertexStyle` and `Stylesheet.getDefaultEdgeStyle` no longer return `undefined`.
- remove the `CellMap` type. It was not used in the maxGraph code, which should have no impact.

For more details, see the [0.3.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.3.0) on
the GitHub release page.

## 0.2.1

Release date: `2023-06-08`

This is a bug fix release.

For more details, see the [0.2.1 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.2.1) on
the GitHub release page.

## 0.2.0

Release date: `2023-05-22`

This release contains bug fixes and documentation improvements.

**Breaking Changes**:
  - helper functions involving _style in the string form_ have been removed from `styleUtils`. Styles are defined using
  the `CellStateStyle` and it is no longer necessary to process strings. For more details, see [PR #173](https://github.com/maxGraph/maxGraph/pull/173) and commit [5ecfda6](https://github.com/maxGraph/maxGraph/commit/5ecfda6b2b326c86597a3e3a6c4fb0548d3666b8).
  - some types related to `CellStateStyle` have been renamed. For more details, see [PR #165](https://github.com/maxGraph/maxGraph/pull/165) and commit [ca1914b](https://github.com/maxGraph/maxGraph/commit/ca1914b5824eed253556df585337aa07d974e920).
  - some properties of `CellStateStyle` have changed (removed or renamed). The renamed properties better match the former `mxGraph` properties. For more details, see [PR #165](https://github.com/maxGraph/maxGraph/pull/165) and commit [ca1914b](https://github.com/maxGraph/maxGraph/commit/ca1914b5824eed253556df585337aa07d974e920).

For more details, see the [0.2.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.2.0) on
the GitHub release page.

## 0.1.0

Release date: `2022-11-22`

Initial `mxGraph` implementation. This is an **alpha** version.

Starting from the mxGraph 4.2.2 release, we
- moved code to ES9
- removed Internet Explorer specific code
- migrated to TypeScript, based on the work initiated in [typed-mxgraph](https://github.com/typed-mxgraph/typed-mxgraph)
- migrated the examples to [Storybook](https://storybook.js.org/)

For more details, see the [0.1.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.1.0) in the GitHub releases page.


## `mxGraph` Change Log

The `maxGraph`implementation is derived from the `mxGraph v4.2.2` implementation.

The mxGraph change log can be found at the following addresses:
  - https://github.com/jgraph/mxgraph/blob/v4.2.2/ChangeLog
  - https://github.com/maxGraph/maxGraph/blob/f9d757548ea8fb924c1ac47117d1e5b05bc58a6b/ChangeLog

This repository previously stored the `mxGraph` tags, they have been removed to only keep the `maxGraph` tags. See discussions
in [#92](https://github.com/maxGraph/maxGraph/issues/92) for more details.

The former `mxGraph` tags can be found in https://github.com/jgraph/mxgraph, or you can find their related commit in the list below: 
- vpages-test-1700-24092012 09639c08cf28cb1b418bd1b05c9e6f93f61aaf88
- vdeployment_test 09639c08cf28cb1b418bd1b05c9e6f93f61aaf88
- v4.2.2 81dcd5cc86d48792c194ebaa3437a7ebb7a2f9d1
- v4.2.1 273779f744f4ff9012847a423bbb620839da58bb
- v4.2.0 aa11697fbd5ba9f4bb0fd28ee147689c3a75c226
- v4.1.1 25a2da3d752f17b659fdb9e9f5f8d428f5bd4889
- v4.1.0 c73f7a00cb28404427d1d24e2e31d4ce622beb75
- v4.0.6 51382db43061ac4f30a87c835d17e306378b1af4
- v4.0.5 44fb5af106bafabe120b065d0c8aa4545a526639
- v4.0.4 91c87f32d91b61e7d731c1a940cf0e9b9aaf4a77
- v4.0.3 12621211eed3495188c95bbc4b3020a1db451df5
- v4.0.2 47c035808ae7fa2e5ef072031ca79ca2d873ab59
- v4.0.1 7bb0ef2877d526fb68b45d754fe088af18758d7c
- v4.0.0 33911ed7e055c17b74d0367f5f1f6c9ee4b4fd44
- v3.9.12 62bca567b0c1eda8760f9834f0a40d8221ebce04
- v3.9.11 55d6851cb426ea53f79fa71f97f37ac81d38bc43
- v3.9.10 4f680fe27e9103af2aa83007b66ca963e6a45497
- v3.9.9 d5c1345ec946b9d55a9c2a8c1c5df0f154561edf
- v3.9.8 bc595336f93db1889158a45651ffa9b52009af0b
- v3.9.7 f4ec51f7049a725e32f71a5d1811790d92259716
- v3.9.6 e7f3573c91043840f2304bfa5b5986f719bfb394
- v3.9.5 641f6cca6679b1270dfbbb24029daac686ee75ec
- v3.9.4 e6a6ed657d004f6f17b3ec5b403c97ffa6e672ef
- v3.9.3 02112de29a26f8c575585b843e21c71d6d36acfa
- v3.9.2 5862280aa421e2a9448f32437906c80c4be7ce10
- v3.9.1 dd54a4dc85f68f22907f22d896fb121b39852118
- v3.9.0 ec3d5af0ee1152569a7cf4e4c99f764cca24b72e
- v3.8.0 58d19b2379444c92038f27345668a41d9cc16707
- v3.7.6 97b3718db64a6ca9afb3382de2926eb8da660052
- v3.7.5 8dea670d0aba25347900869c023bb1710832371d
- v3.7.4 0810c3895c0f29b2fe148ead8ad8f11bc567fc28
- v3.7.3 7a16775f676b83165fd331b900fbee7bc4402619
- v3.7.2 35d8571728de3a54f2ab3385a0df469d1d80c164
- v3.7.1 7314db0c7a8cb6dbfb18431e6ab574c804afdb22
- v3.7.0.1 9a8f5006221214622f36b5cc2d864e9344f18fb8
- v3.7.0.0 1b2e632c45f9d1a78491c2380ccd51a1acc73912
- v3.6.0.0 3c2d9429d70ded25c0db1c561d841935b275cefd
- v3.5.1.5 97fbbaf0fae7a9e008638d5d703d645810cd19ec
- v3.5.1.4 5d7331fd0104998a05d56e9d5edacb057b7a96b9
- v3.5.1.3 8da7d140ef0c08e87e72303915819498b816675d
- v3.5.1.2 cce977665879d224d9fdff58ca8a189401e385f6
- v3.5.1.1 01edf02ec1b151a6ddf6de51e6ff24e9da6d42c5
- v3.5.1.0 e409e12a8d150b64ce28416845ccbc4655c4f82c
- v3.5.0.0 7f4867f977574ad49362d9cdbc457ad310b8a59e
- v3.4.1.3 38bfe73d614944b61ba0a3fc6281b8db22104495
- v3.4.1.2 ee52fb9b1d2e499867bee55cd55546951f616dcc
- v3.4.1.1 d4fb237920b1a2fd6332034afee5176ee0e066c2
- v3.4.1.0 467fb7eb7988f5e9070aeef003e05158d3e02cfe
- v3.4.0.3 bc79dfc5e79061abb9fd64ac069bd2ddb172baac
- v3.4.0.2 dc938d3071e1b52984465ac4eead7f48d0c1f34e
- v3.4.0.1 0925f2fc9518bc4132e138a2c5b6090690176830
- v3.4.0.0 7815de6cb83a7d763b4b0504821dc81024384e96
- v3.3.1.1 b030680f823cccac556fce16aac1c43dca02eb01
- v3.3.1.0 4ac82539ccb9a76aabd478fdb5691ec19683c7a4
- v3.3.0.1 084abe9b46e164e962159998422ce33405c40aab
- v3.3.0.0 731bcee03bb50beb02c3a213a5432a558d49e849
- v3.2.0.0 83f392cc7d2e8a3b4e467a479cf0b803a219d042
- v3.1.3.0 74c7f9d5c45a67c6b6620fd1542e28872ae87808
- v3.1.2.2 59cd1add8d0f198c41d98c4c9d7dd613df38e57d
- v3.1.2.1 b2b4b59e7d7843349be2c50057f963d53220072b
- v3.1.2.0 f876b08e84ec8abddc95cea6a2618c89007ae0cc
- v3.1.1.1 5ec7d819c4cf1ebab532d53ac0369218d9752920
- v3.1.1.0 915cf660de4a981020821c66a2bf191db2c1b549
- v3.1.0.1 71bf3abcb8d836d54fb32498eb05f1fd32b15752
- v3.1.0.0 9213930db03e2a2f5d8b32695a6f9da77a29be6d
- v3.0.1.1 4733648ef2f9a26316f9eafc425763b749b5ac3a
- v3.0.1.0 f48087f82bbeb660abb2bd53407cb82924091307
- v3.0.0.0 828b939ea76aa4a252511476926b5d6b1bdbb0b5
- v2.9.0.1 c1501a882b2723f1568b53ba3a99a63779761bfa
- v2.9.0.0 45524e4eb78f8c77367fad78bab4dc1298397a67
- v2.8.2.0 cd22a58ab5312270b832d3e9bccd695d82a6ea5f
- v2.8.1.0 70a6743c34943139efbdf5b374c86cc37e53a866
- v2.8.0.0 ff6744c75439fd9d51f41b6978787abdb0e7d7cc
- v2.7.0.0 3182bec5475bade5ea757634ec14134842897526
- v2.6.0.0 fbd2e146d276d9fa22e9655c1c80f57a6dbf65bb
- v2.5.1.1 9f895151adec7c64ea71922acd31bf9b912bd62b
- v2.5.1.0 04b1c6d4877143e1763f6043a3e222ec62b9ff31
- v2.5.0.3 99fc49e85e8e8fbaf14cc6cb226e84b4dc48c637
- v2.5.0.2 088f3f4e25b1a991383ea906ac8753a2ad082813
- v2.5.0.1
- v2.5.0.0 1db5e92ac7833d36d39a009d85565eb42467a01e
- v2.4.1.0 85765d1b248ca9f06da8d0b19d63f5d91ebc3858
- v2.4.0.4 9fd84ceccade6a48573d7d49e6f7c65ac4264ff7
- v2.4.0.3 8df1a017d76b35ee48fd517ae8b7b177650a03ec
- v2.4.0.2 371344bad70a10cccb61c5ed7f31b8953795d91d
- v2.4.0.1 e264f196cc2d3aabff252dc3ae2279f7e8bacde0
- v2.4.0.0 138e53ebee947bc95446cb2515d604b52d696d9f
- v2.3.0.5 a425c3cd8abede042fd0b0aca9393a9a70e125a5
- v2.3.0.4 fb032c6f8c707c098bcaf902a1c33e6fbc86f946
- v2.3.0.3 ea516c51412ba5717b9e87c2d015746ff6d4adc8
- v2.3.0.2 310fd539558af5096b0c5924ac8013dc271d39a1
- v2.3.0.1 c9167b72ce562237405f135b78a8e4ec0a674d10
- v2.3.0.0 e42acd98f27f13740b030cfc61e61caa53606c49
- v2.2.0.5 4b9d6b563fc9746e69796a05781643aeadd62925
- v2.2.0.4 0b5417082707a719e3b351dc026de681e2ac0bda
- v2.2.0.3 ee658e6903d33e9a8080f29b7d507a378afefb3e
- v2.2.0.2 31001278bebc41cf96c935b5ebcc51bbb3e6f82b
- v2.2.0.1 6b00bd8ea0b02f86821841e09f57c3da4554b8e9
- v2.2.0.0 603a5f7e1e7ac9b10a019d231096ddf47ac0c19a
- v2.1.1.2 53b1f6acd266b36593a2d08c117635440337dec4
- v2.1.1.1 5baaf3e5c085333dc6b0dc3eb31b9acd4ecea093
- v2.1.1.0 ae6237648ddba4d01ffba21604a9e6d91cfe6f73
- v2.1.0.9 c1a511a0a0b0ce4cdce6433d1def6e5d971fd03c
- v2.1.0.8 952b29b9afcb754ceec398909cc1d48d54cd8eff
- v2.1.0.7 5d2641995eea1f8b714db0ee2516929541a79581
- v2.1.0.6 d6ace403d67ef5c6b4fab11f69ef752dd145e7de
- v2.1.0.5 1dd199a3ae51f7c5cf391fd7bc8e72c32598a8db
- v2.1.0.4 a7ce177fa30ab10dfff9a60325f84d6156035f46
- v2.1.0.3 fe2375924a3b54871ddc8e99ee7ea18cd40f44e0
- v2.1.0.2 8950dd8e88937b699d140ece8d6dd2cb3666d98b
- v2.1.0.1 4fe3144a9147a578bd5d673b8c5908a1a611fac7
- v2.1.0.0 8602a11f0f3abf67d7bbc1fa34018ab176af7ca3
- v2.0.0.1 5dc3a07195313fd134bf8b058f4ae1d660202e07
- v2.0.0.0 3bbcad7e0fd4c0c1a1000c56691d936426730c7a
- v1.14.0.2 3f2512fe8752c1300b50b07b315dff9dc4ccd975
- v1.13.0.17 34ee3371baead0aa91e40c3fbefce8576a3f1b7b
- v1.13.0.16 67eaf25c68418150d2b91786278a2b43ff762cdc
- v1.13.0.15 8d6d8504e9ff87e7783451f6ad507fb9bb2e1928
- v1.13.0.14 1f8163f8a5f32be44a621da7db448f1185bfb68f
- v1.13.0.13 1f8163f8a5f32be44a621da7db448f1185bfb68f
- v1.13.0.12 98b7a08be1f9bf957c1ce98e77cf26fc195b6578
- v1.13.0.11 edf8bacd109b1258abb00ad9485801be9dabdd1f
- v1.13.0.10 cfaf794b7a4cb4a751591c582c22a4fc647a9066
- v1.13.0.9 051ae6947eac69ee6c32aac37f79bdef1f920057
- v1.13.0.8 4a22fac6217268178b2a1544a6fdd28d612b24fe
- v1.13.0.7 09ed53864fe4b1c1ec61750840fc50ca13716731
- v1.13.0.6 f3f3ed6a2499de580344bed0b6fda2a646185988
- v1.13.0.5 3c12caa190a274df6bde6d4c8ed7e8e353b4c6f2
- v1.13.0.4 050668f1b1651f4e16a1e61e94ffc9336d614e86
- v1.13.0.3 3cf9ec35f1de12905dbfe24c2b0b93297145b343
- v1.13.0.2 27702057a3977f49ba30562f1bccbebacbe53c5b
- v1.13.0.1 95af718eda1f2fe61a1399a049b23601865e6eef
- v1.13.0.0 c11360842638913502a36c639c33bedc6eecebde
- v1.12.0.2 d2324715a1295ed67ed5a47b62e2837a984a679b
- v1.12.0.1 07a9c2b1be6a55383cb594f031a8789de2d97b5d
- v1.12.0.0 9138794c1f68124498aec9b77d02d26b214338a1
- v1.11.0.0 62d359a5e77def0e3b8f669a7e5343f62b14eaf6
- v1.10.4.3 bd324b6562dd695b1cfa27ea6b173aa477f7fb3e
- v1.10.4.2 980f7e558be6b71ff2abfc29682ed657309d6713
- v1.10.4.1 a607c0ffbd940208077148a7b37583e3f854661a
- v1.10.4.0 64fc90d13ed018d183a20340e1ff27b4bc00bbb7
- v1.10.3.2 a29646eaef5b886710f7fbc275ecbd2ac802bd6c
- v1.10.3.1 85e5b32551bcdab723077b79736cb7fa51de4a24
- v1.10.2.1 fbdb0b867332f924c4459830b3d330f34c2d6f4e
- v1.2.0.0 6ad8e6a083f1cf002945fe34e088236b19b8be3f
- test1 bf147d7bfab4bfc159605b4bdf66b5e80eee0819
- 1.10.3.0 78089c7d8754af7fbf2feee57ff210525913417d


