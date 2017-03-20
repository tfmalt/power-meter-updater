[![npm version](https://badge.fury.io/js/power-meter-updater.svg)](http://badge.fury.io/js/power-meter-updater)
[![Build Status](https://travis-ci.org/tfmalt/power-meter-updater.svg?branch=master)](https://travis-ci.org/tfmalt/power-meter-updater)
[![Test Coverage](https://codeclimate.com/github/tfmalt/power-meter-updater/badges/coverage.svg)](https://codeclimate.com/github/tfmalt/power-meter-updater/coverage)
[![Dependency Status](https://david-dm.org/tfmalt/power-meter-updater.svg)](https://david-dm.org/tfmalt/power-meter-updater)

## Power Meter Updater

This is part of a hobby project using an Arduino Uno or Raspberry Pi with
a photo resistor to read the flashing led on my power meter monitor my
electricity usage.

This is a companion repository to the main Arduino or Raspberry Pi code. I
wanted to simplify the main monitoring daemon as much as possible, delegating
to this module to create the various statistical data sets I wanted.

* See: [power-meter-monitor](https://github.com/tfmalt/power-meter-monitor) for
the main Raspberry or Arduino controller code
* See: [power-meter-api](https://github.com/tfmalt/power-meter-api) For the
restful web service API that provides access to the datasets for this app and
others.
* See: [power-meter-ionic](https://github.com/tfmalt/power-meter-ionic) for information about the ionic mobile app dashboard.
