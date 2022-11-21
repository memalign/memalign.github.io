#!/usr/bin/perl
#

# Usage: cat file.css | perl extractCSSResourceURLs.pl

my $urlPrefix = "https://viz.intelligence.rocks";
my $runCurl = 0;

while(<>) {
  my $line = $_;

  my @lines = split(/(url\([^\)]+\))/, $line);

  foreach my $l (@lines) {
    if ($l =~ /url\(([^\)]+)\)/) {
      my $url = $1;
      print "$urlPrefix$url\n";

      if ($runCurl) {
        `curl -O -- "$urlPrefix$url"`;
      }
    }
  }
}
