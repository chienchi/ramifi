#!/usr/bin/env bash
set -e
rootdir=$( cd $(dirname $0) ; pwd -P )
tempdir=$rootdir/tmpOut

test_result(){
        Test=$tempdir/recombinant_reads.stats
        Expect=$rootdir/output/recombinant_reads.stats
        testName="run test";
        if diff <(tail $Expect) <(tail $Test)
        then
                echo "$testName passed!"
                touch "$tempdir/test.success"
        else
                echo "$testName failed!"
                touch "$tempdir/test.fail"
        fi
}

cd $rootdir
echo "Working Dir: $rootdir";
echo "Running Test ..."

rm -rf $tempdir
mkdir -p $tempdir
cd $tempdir
$rootdir/../ramifi/ramifi --verbose --bam $rootdir/input/test.sort.bam --refacc NC_045512.2 || true
#$rootdir/../ramifi/ramifi --verbose --vcf $rootdir/input/test.vcf --bam $rootdir/input/test.sort.bam --refacc NC_045512.2 || true

test_result;
