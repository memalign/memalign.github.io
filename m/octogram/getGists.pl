#!/usr/bin/perl

my @gists = (
  "436869fba267d690fe85bd8143993faf",
  "2fe3172d2b9fe684977d184f1b6226d5",
  "6f30db6b3c3011093f343006f1c8f12c",
  "cfdcc6e23f1fb3e9de2fd42fafaf4d4c",
  "5561f3438a9f1b1df0fa99fa6db960ec",
  "9eb8f8f3df4efb450b798a279eeba2e0",
  "a4bb2bf44284bdb9347cf3f1399d4f11",
  "67df4144b005eca94f742f4914defc14",
  "ac31e554519d0394efa18f2184cfe526",
  "b9ee2473a92586a8d0dc32f27a5f38f3",
  "bc929f97dfb013a5f62ab58ac2d117c0",
  "11e4b70206715622bc03cc5cae16e650",
  "9ebe1e5ad44ac22259343de170a3b337",
  "cbdb2df1e843449b8aec56b7cdae036a",
  "a95269130d520a58adf710b692d1e52e",
  "5e841571fd059992949fe6940bc95475",
  "1e4df9559568da05896e8e7486fc2c4c",
  "998d2566bd2a343ddf7cf4aa7d5962ba",
  "ef9e3bf2eb459b52ba91f155f7b18480",
  "aa0f3598496e8d604e9246451b4d1f84",
  "d42bf2a870aab3a2deca6132ff6ebad5",
  "a0b8021cf42acc89306c",
);

foreach my $gist (@gists) {
  `curl https://api.github.com/gists/$gist > $gist.json`;
  sleep(1);
}
