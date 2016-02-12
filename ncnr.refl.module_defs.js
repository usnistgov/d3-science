var instruments = instruments || {};
instruments["ncnr.refl"] = instruments["ncnr.refl"] || {};

var module_defs_list = 
[
  {
    "inputs": [
      {
        "multiple": true, 
        "description": "Input data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "No operation.", 
    "fields": [], 
    "name": "Nop", 
    "version": "2015-12-31", 
    "outputs": [
      {
        "multiple": true, 
        "description": "Unaltered data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.nop", 
    "id": "ncnr.refl.nop", 
    "icon": null
  }, 
  {
    "inputs": [], 
    "description": "Load a list of nexus files from the NCNR data server.", 
    "fields": [
      {
        "multiple": true, 
        "description": "List of files to open.  Fileinfo is a structure with { path: location on server, mtime: expected modification time }.", 
        "datatype": "fileinfo", 
        "required": true, 
        "label": "Filelist", 
        "default": null, 
        "id": "filelist"
      }
    ], 
    "name": "Ncnr Load", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": true, 
        "description": "All entries of all files in the list.", 
        "datatype": "ncnr.refl.refldata", 
        "required": true, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.ncnr_load", 
    "id": "ncnr.refl.ncnr_load", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "Attenuated detector counts", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Attenuated", 
        "default": null, 
        "id": "attenuated"
      }, 
      {
        "multiple": false, 
        "description": "Unattenuated detector counts", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Unattenuated", 
        "default": null, 
        "id": "unattenuated"
      }
    ], 
    "description": "Fit detector dead time constants (paralyzing and non-paralyzing) frommeasurement of attenuated and unattenuated data for a range of count rates.", 
    "fields": [
      {
        "multiple": false, 
        "description": "Measured tube", 
        "datatype": "detector|monitor", 
        "required": false, 
        "label": "Source", 
        "default": "detector", 
        "id": "source"
      }, 
      {
        "multiple": false, 
        "description": "Dead-time mode", 
        "datatype": "P|NP|mixed|auto", 
        "required": false, 
        "label": "Mode", 
        "default": "auto", 
        "id": "mode"
      }
    ], 
    "name": "Fit Dead Time", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "Dead time constants, attenuator estimate and beam rate", 
        "datatype": "ncnr.refl.deadtime", 
        "required": false, 
        "label": "Dead Time", 
        "default": null, 
        "id": "dead_time"
      }
    ], 
    "action_id": "reflred.steps.steps.fit_dead_time", 
    "id": "ncnr.refl.fit_dead_time", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "Uncorrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }, 
      {
        "multiple": false, 
        "description": "Dead time information", 
        "datatype": "ncnr.refl.deadtime", 
        "required": true, 
        "label": "Dead Time", 
        "default": null, 
        "id": "dead_time"
      }
    ], 
    "description": "Correct the monitor dead time from the fitted dead time.If *tau_NP* and *tau_P* are non-zero, then use them.  If a dead_timefit result is supplied, then use it.  If the dead time constants aregiven in the data file, then use them.  Otherwise don't do anydead time correction.", 
    "fields": [
      {
        "multiple": false, 
        "description": "non-paralyzing dead time constant", 
        "datatype": "float:us", 
        "required": false, 
        "label": "Nonparalyzing", 
        "default": 0.0, 
        "id": "nonparalyzing"
      }, 
      {
        "multiple": false, 
        "description": "paralyzing dead time constant", 
        "datatype": "float:us", 
        "required": false, 
        "label": "Paralyzing", 
        "default": 0.0, 
        "id": "paralyzing"
      }
    ], 
    "name": "Monitor Dead Time", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "Dead-time corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.monitor_dead_time", 
    "id": "ncnr.refl.monitor_dead_time", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "Uncorrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }, 
      {
        "multiple": false, 
        "description": "Dead time information", 
        "datatype": "ncnr.refl.deadtime", 
        "required": true, 
        "label": "Dead Time", 
        "default": null, 
        "id": "dead_time"
      }
    ], 
    "description": "Correct the detector dead time from the fitted dead time.If *tau_NP* and *tau_P* are non-zero, then use them.  If a dead_timefit result is supplied, then use it.  If the dead time constants aregiven in the data file, then use them.  Otherwise don't do anydead time correction.", 
    "fields": [
      {
        "multiple": false, 
        "description": "non-paralyzing dead time constant", 
        "datatype": "float:us", 
        "required": false, 
        "label": "Nonparalyzing", 
        "default": 0.0, 
        "id": "nonparalyzing"
      }, 
      {
        "multiple": false, 
        "description": "paralyzing dead time constant", 
        "datatype": "float:us", 
        "required": false, 
        "label": "Paralyzing", 
        "default": 0.0, 
        "id": "paralyzing"
      }
    ], 
    "name": "Detector Dead Time", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "Dead-time corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.detector_dead_time", 
    "id": "ncnr.refl.detector_dead_time", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": true, 
        "description": "Uncorrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Correct the monitor dead time from stored saturation curve.", 
    "fields": [], 
    "name": "Monitor Saturation", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": true, 
        "description": "Dead-time corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.monitor_saturation", 
    "id": "ncnr.refl.monitor_saturation", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": true, 
        "description": "Uncorrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Correct the detector dead time from stored saturation curve.", 
    "fields": [], 
    "name": "Detector Saturation", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": true, 
        "description": "Dead-time corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.detector_saturation", 
    "id": "ncnr.refl.detector_saturation", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "Uncorrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Correct the theta offset of the data, shifting sample and detectorangle and updating $q_x$ and $q_z$.", 
    "fields": [
      {
        "multiple": false, 
        "description": "amount of shift to add to sample angle and subtract from detector angle", 
        "datatype": "float:degree", 
        "required": false, 
        "label": "Offset", 
        "default": 0.0, 
        "id": "offset"
      }
    ], 
    "name": "Theta Offset", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "Offset corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.theta_offset", 
    "id": "ncnr.refl.theta_offset", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "Uncorrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Reverse the sense of the reflection angles, making positive anglesnegative and vice versa.", 
    "fields": [], 
    "name": "Back Reflection", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "Angle corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.back_reflection", 
    "id": "ncnr.refl.back_reflection", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "Uncorrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Assume all reflection is off the top surface, reversing the senseof negative angles.", 
    "fields": [], 
    "name": "Absolute Angle", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "Angle corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.absolute_angle", 
    "id": "ncnr.refl.absolute_angle", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "data without resolution estimate", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Estimate divergence from slit openings.", 
    "fields": [], 
    "name": "Divergence", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "data with resolution estimate", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.divergence", 
    "id": "ncnr.refl.divergence", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "background data which may contain specular point", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Identify and mask out specular points.This defines the *mask* attribute of *data* as including all points thatare not specular or not previously masked.  The points are not actuallyremoved from the data, since this operation is done by *join*.", 
    "fields": [], 
    "name": "Mask Specular", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "masked data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.mask_specular", 
    "id": "ncnr.refl.mask_specular", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": true, 
        "description": "background data which may contain specular point", 
        "datatype": "ncnr.refl.refldata", 
        "required": true, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Identify and mask out user-specified points.This defines the *mask* attribute of *data* as including all points thatare not previously masked.  The points are not actuallyremoved from the data, since this operation is done by *join*.", 
    "fields": [
      {
        "multiple": true, 
        "description": "sparse dict of masked data points, as {\"0\": [2,4,5], \"5\": [0]}", 
        "datatype": "indexlist", 
        "required": true, 
        "label": "Mask Indices", 
        "default": null, 
        "id": "mask_indices"
      }
    ], 
    "name": "Mask Points", 
    "version": "2016-02-08", 
    "outputs": [
      {
        "multiple": true, 
        "description": "masked data", 
        "datatype": "ncnr.refl.refldata", 
        "required": true, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.mask_points", 
    "id": "ncnr.refl.mask_points", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "data file which may or may not have intent marked", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Mark the file type based on the contents of the file, or override.*intent* can be 'infer', to guess the intent from the measurement geometry,'auto' to use the recorded value for the intent if present, otherwiseinfer it from the geometry, or the name of the intent.For inferred intent, it is 'specular' if incident angle matches detectorangle within 0.1*angular divergence, 'background+' if incident angle isgreater than detector angle, 'background-' if incident angle is lessthan detector angle, 'slit' if incident and detector angles are zero,'rock sample' if only the incident angle changes, 'rock detector' ifonly the detector angle changes, or 'rock qx' if only $Q_x$ is changingthroughout the scan.", 
    "fields": [
      {
        "multiple": false, 
        "description": "intent to register with the datafile, or auto/infer to guess", 
        "datatype": "auto|infer|specular|background+|background-|slit|rock sample|rock detector|rock qx", 
        "required": false, 
        "label": "Intent", 
        "default": "auto", 
        "id": "intent"
      }
    ], 
    "name": "Mark Intent", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "marked data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.mark_intent", 
    "id": "ncnr.refl.mark_intent", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": true, 
        "description": "data files with intent marked", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Split a bundle into multiple bundles using intent.", 
    "fields": [], 
    "name": "Group By Intent", 
    "version": "", 
    "outputs": [
      {
        "multiple": true, 
        "description": "specular measurements", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Specular", 
        "default": null, 
        "id": "specular"
      }, 
      {
        "multiple": true, 
        "description": "positive offset background measurements", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Backp", 
        "default": null, 
        "id": "backp"
      }, 
      {
        "multiple": true, 
        "description": "negative offset background measurements", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Backm", 
        "default": null, 
        "id": "backm"
      }, 
      {
        "multiple": true, 
        "description": "beam intensity measurements", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Intensity", 
        "default": null, 
        "id": "intensity"
      }, 
      {
        "multiple": true, 
        "description": "rocking curve measurements", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Rock", 
        "default": null, 
        "id": "rock"
      }, 
      {
        "multiple": true, 
        "description": "everything else", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Other", 
        "default": null, 
        "id": "other"
      }
    ], 
    "action_id": "reflred.steps.steps.group_by_intent", 
    "id": "ncnr.refl.group_by_intent", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "data to normalize", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Estimate the detector count rate.*base* can be monitor, time, power, or none for no normalization.For example, if base='monitor' then the count rate will be countsper monitor count.  Note that operations that combine datasets requirethe same normalization on the points.If *base* is auto then the default will be chosen, which is 'monitor'if the monitor exists, otherwise it is 'time'.When viewing data, you sometimes want to scale it to a nice numbersuch that the number of counts displayed for the first point isapproximately the number of counts on the detector.", 
    "fields": [
      {
        "multiple": false, 
        "description": "how to convert from counts to count rates", 
        "datatype": "auto|monitor|time|power|none", 
        "required": false, 
        "label": "Base", 
        "default": "auto", 
        "id": "base"
      }
    ], 
    "name": "Normalize", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "data with count rate rather than counts", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.normalize", 
    "id": "ncnr.refl.normalize", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "data to scale", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Rescale the count rate by some scale and uncertainty.", 
    "fields": [
      {
        "multiple": false, 
        "description": "amount to scale", 
        "datatype": "float:", 
        "required": false, 
        "label": "Scale", 
        "default": 1.0, 
        "id": "scale"
      }, 
      {
        "multiple": false, 
        "description": "scale uncertainty for gaussian error propagation", 
        "datatype": "float:", 
        "required": false, 
        "label": "Dscale", 
        "default": 0.0, 
        "id": "dscale"
      }
    ], 
    "name": "Rescale", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "scaled data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.rescale", 
    "id": "ncnr.refl.rescale", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": true, 
        "description": "data to join", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Join operates on a list of datasets, returning a list with one datasetper intent/polarization.  When operating on a single dataset, it joinsrepeated points into single points.*tolerance* (default=0.05) is a scale factor on $\\Delta     heta$ used todetermine whether two angles are equivalent.  For a given tolerance$\\epsilon$, a point at incident angle $     heta_1$ can be joinedwith one with incident angle $      heta_2$ when$|  heta_1 -        heta_2| < \\epsilon \\cdot \\Delta heta$.The join algorithm is greedy, so if you have a sequence of points withindividual separation less than $\\epsilon\\cdot\\Delta        heta$ but totalspread greater than $\\epsilon\\cdot\\Delta    heta$, they will be joinedinto multiple points with the final with the final point having worsestatistics than the prior points.*order* is the sort order of the files that are joined.  The firstfile in the sorted list determines the metadata such as the basefile name for the joined file.The joined datasets will be sorted as appropriate for the themeasurement intent.  Masked points will be removed.", 
    "fields": [
      {
        "multiple": false, 
        "description": "allowed separation between points while still joining them to a single point; this is relative to the angular resolution of the each point", 
        "datatype": "float:", 
        "required": false, 
        "label": "Tolerance", 
        "default": 0.05, 
        "id": "tolerance"
      }, 
      {
        "multiple": false, 
        "description": "order determines which file is the base file, supplying the metadata for the joind set", 
        "datatype": "file|time|theta|slit|none", 
        "required": false, 
        "label": "Order", 
        "default": "file", 
        "id": "order"
      }
    ], 
    "name": "Join", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": true, 
        "description": "joined data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.join", 
    "id": "ncnr.refl.join", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "background data with unknown $q$", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Determine the Qz value associated with the background measurement.The *offset* flag determines which background points are matchedto the sample points.  It can be 'sample' if background ismeasured using an offset from the sample angle, or 'detector'if it is offset from detector angle.   If *offset* is 'auto', thenwe guess whether it is a offset from sample or detector.For 'auto' alignment, we can only distinguish relative and constant offsets,not  whether it is offset from sample or detector, so we must rely onconvention. If the offset is constant for each angle, then it is assumedto be a sample offset.  If the offset is proportional to the angle (andtherefore offset/angle is constant), then it is assumed to be a detectoroffset. If neither condition is met, it is assumed to be a sample offset.The 'auto' test is robust: 90% of the points should be within 5% of themedian value of the vector for the offset to be considered a constant.", 
    "fields": [
      {
        "multiple": false, 
        "description": "angle which determines $q_z$", 
        "datatype": "auto|sample|detector", 
        "required": false, 
        "label": "Offset", 
        "default": "auto", 
        "id": "offset"
      }
    ], 
    "name": "Align Background", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "background with known $q$", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.align_background", 
    "id": "ncnr.refl.align_background", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "specular data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }, 
      {
        "multiple": false, 
        "description": "plus-offset background data", 
        "datatype": "ncnr.refl.refldata", 
        "required": true, 
        "label": "Backp", 
        "default": null, 
        "id": "backp"
      }, 
      {
        "multiple": false, 
        "description": "minus-offset background data", 
        "datatype": "ncnr.refl.refldata", 
        "required": true, 
        "label": "Backm", 
        "default": null, 
        "id": "backm"
      }
    ], 
    "description": "Subtract the background datasets from the specular dataset.The background+ and background- signals are removed from the list ofdata sets, averaged, interpolated, and subtracted from the specular.If there is no specular, then the backgrounds are simply removed andthere is no further action.  If there are no backgrounds, then thespecular is sent through unchanged.  Slit scans and rocking curvesare not affected.This correction only operates on a list of datasets.  A single datasetwhich contains both specular and background, such as a PSD measurement,must first be filtered through a correction to separate the specularand background into a pair of datasets.Background subtraction is applied independently to the differentpolarization cross sections.", 
    "fields": [], 
    "name": "Subtract Background", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "background subtracted specular data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.subtract_background", 
    "id": "ncnr.refl.subtract_background", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "specular, background or subtracted data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }, 
      {
        "multiple": false, 
        "description": "intensity data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Base", 
        "default": null, 
        "id": "base"
      }
    ], 
    "description": "Scale data by incident intensity.Data is matched according to angular resolution, assuming all data withthe same angular resolution was subject to the same incident intensity.", 
    "fields": [], 
    "name": "Divide Intensity", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "reflected intensity", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.divide_intensity", 
    "id": "ncnr.refl.divide_intensity", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": true, 
        "description": "slits to align and smooth", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Datasets", 
        "default": null, 
        "id": "datasets"
      }
    ], 
    "description": "Align slits with a moving window 1-D polynomial least squares filter.Updates *slit1.x*, *slit2.x* and *angular_resolution* attributes of theslit measurements so they all use a common set of points.Updates divergence automatically after smoothing.", 
    "fields": [
      {
        "multiple": false, 
        "description": "polynomial degree on smoothing filter", 
        "datatype": "int", 
        "required": false, 
        "label": "Degree", 
        "default": 1, 
        "id": "degree"
      }, 
      {
        "multiple": false, 
        "description": "number of consecutive points to use in the fit. Odd sized *span* is preferred.  *span* must be larger than *degree*. *degree=1* and *span=2* is equivalent to linear interpolation.", 
        "datatype": "int", 
        "required": false, 
        "label": "Span", 
        "default": 2, 
        "id": "span"
      }, 
      {
        "multiple": false, 
        "description": "size within which slits can be merged.", 
        "datatype": "float:mm", 
        "required": false, 
        "label": "Dx", 
        "default": 0.01, 
        "id": "dx"
      }
    ], 
    "name": "Smooth Slits", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": true, 
        "description": "aligned and smoothed slits.", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Outputs", 
        "default": null, 
        "id": "outputs"
      }
    ], 
    "action_id": "reflred.steps.steps.smooth_slits", 
    "id": "ncnr.refl.smooth_slits", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "direct beam measurement to determine polarization", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Compute polarizer and flipper efficiencies from the intensity data.If clip is true, reject points above or below particular efficiencies.The minimum intensity is 1e-10.  The minimum efficiency is 0.9.The computed values are systematically related to the efficiencies:  beta: intensity/2  fp: front polarizer efficiency is F  rp: rear polarizer efficiency is R  ff: front flipper efficiency is (1-x)/2  rf: rear flipper efficiency is (1-y)/2reject is the indices of points which are clipped because theyare below the minimum efficiency or intensity.See PolarizationEfficiency.pdf for details on the calculation.", 
    "fields": [
      {
        "multiple": false, 
        "description": "front/rear balance of to use for efficiency loss", 
        "datatype": "float:", 
        "required": false, 
        "label": "Frbalance", 
        "default": 0.5, 
        "id": "FRbalance"
      }, 
      {
        "multiple": false, 
        "description": "minimum efficiency cutoff", 
        "datatype": "float:", 
        "required": false, 
        "label": "Emin", 
        "default": 0.0, 
        "id": "Emin"
      }, 
      {
        "multiple": false, 
        "description": "minimum intensity cutoff", 
        "datatype": "float:", 
        "required": false, 
        "label": "Imin", 
        "default": 0.0, 
        "id": "Imin"
      }, 
      {
        "multiple": false, 
        "description": "clip efficiency between minimum and one", 
        "datatype": "bool", 
        "required": false, 
        "label": "Clip", 
        "default": false, 
        "id": "clip"
      }
    ], 
    "name": "Estimate Polarization", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "estimated polarization correction factors", 
        "datatype": "ncnr.refl.poldata", 
        "required": false, 
        "label": "Polarization", 
        "default": null, 
        "id": "polarization"
      }
    ], 
    "action_id": "reflred.steps.steps.estimate_polarization", 
    "id": "ncnr.refl.estimate_polarization", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "polarized data to be corrected", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }, 
      {
        "multiple": false, 
        "description": "estimated polarization efficiency", 
        "datatype": "ncnr.refl.poldata", 
        "required": false, 
        "label": "Polarization", 
        "default": null, 
        "id": "polarization"
      }
    ], 
    "description": "Correct data for polarizer and flipper efficiencies.", 
    "fields": [
      {
        "multiple": false, 
        "description": "correct spinflip data if available", 
        "datatype": "bool", 
        "required": false, 
        "label": "Spinflip", 
        "default": true, 
        "id": "spinflip"
      }
    ], 
    "name": "Correct Polarization", 
    "version": "2015-12-17", 
    "outputs": [
      {
        "multiple": false, 
        "description": "polarization corrected data", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.correct_polarization", 
    "id": "ncnr.refl.correct_polarization", 
    "icon": null
  }, 
  {
    "inputs": [
      {
        "multiple": false, 
        "description": "data to save", 
        "datatype": "ncnr.refl.refldata", 
        "required": false, 
        "label": "Data", 
        "default": null, 
        "id": "data"
      }
    ], 
    "description": "Save data to a particular file", 
    "fields": [
      {
        "multiple": false, 
        "description": "name of the file, or 'auto' to use the basename", 
        "datatype": "str", 
        "required": false, 
        "label": "Name", 
        "default": "auto", 
        "id": "name"
      }, 
      {
        "multiple": false, 
        "description": "file extension, or 'auto' to use the id of the last step", 
        "datatype": "str", 
        "required": false, 
        "label": "Ext", 
        "default": "auto", 
        "id": "ext"
      }, 
      {
        "multiple": false, 
        "description": "data path, or 'auto' to use the current directory", 
        "datatype": "str", 
        "required": false, 
        "label": "Path", 
        "default": ".", 
        "id": "path"
      }
    ], 
    "name": "Save", 
    "version": "2015-12-17", 
    "outputs": [], 
    "action_id": "reflred.steps.steps.save", 
    "id": "ncnr.refl.save", 
    "icon": null
  }, 
  {
    "inputs": [], 
    "description": "Load a list of nexus files from the NCNR data server.", 
    "fields": [
      {
        "multiple": true, 
        "description": "List of files to open.  Fileinfo is a structure with { path: location on server, mtime: expected modification time }.", 
        "datatype": "fileinfo", 
        "required": true, 
        "label": "Filelist", 
        "default": null, 
        "id": "filelist"
      }, 
      {
        "multiple": false, 
        "description": "Automatically calculate the angular divergence of the beam", 
        "datatype": "bool", 
        "required": true, 
        "label": "Auto Divergence", 
        "default": true, 
        "id": "auto_divergence"
      }, 
      {
        "multiple": false, 
        "description": "Automatically correct the detector saturation", 
        "datatype": "bool", 
        "required": true, 
        "label": "Auto Detector Saturation", 
        "default": false, 
        "id": "auto_detector_saturation"
      }, 
      {
        "multiple": false, 
        "description": "Automatically correct the monitor saturation", 
        "datatype": "bool", 
        "required": true, 
        "label": "Auto Monitor Saturation", 
        "default": false, 
        "id": "auto_monitor_saturation"
      }, 
      {
        "multiple": false, 
        "description": "set the intent of the files as with the mark_intent filter", 
        "datatype": "str", 
        "required": true, 
        "label": "Intent", 
        "default": "auto", 
        "id": "intent"
      }
    ], 
    "name": "Super Load", 
    "version": "2015-02-08", 
    "outputs": [
      {
        "multiple": true, 
        "description": "All entries of all files in the list.", 
        "datatype": "ncnr.refl.refldata", 
        "required": true, 
        "label": "Output", 
        "default": null, 
        "id": "output"
      }
    ], 
    "action_id": "reflred.steps.steps.super_load", 
    "id": "ncnr.refl.super_load", 
    "icon": null
  }
]

instruments["ncnr.refl"].modules = {}
for (var i=0; i<module_defs_list.length; i++) {
    var m = module_defs_list[i];
    instruments["ncnr.refl"].modules[m.id] = m;
}
