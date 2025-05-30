import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  type CreateProblemDriverRequest,
  type CreateProblemRequest,
  type CreateProblemValidationResponse,
  Language,
  ProblemDifficulty
} from '../types/models';
import { CodeEditor } from './CodeEditor';
import { ApiErrorDisplay } from './ApiErrorDisplay';
import { useDriverTemplates, useCreateProblem, useValidateProblem } from '../hooks/api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Spinner,
  Tabs,
  Tab
} from '@heroui/react';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const CreateProblem = () => {
  const navigate = useNavigate();
  const { data: driverTemplates = [], isLoading, error } = useDriverTemplates();
  const createProblem = useCreateProblem();
  const validateProblem = useValidateProblem();

  const [problem, setProblem] = useState<Partial<CreateProblemRequest>>({
    name: '',
    description: '',
    difficulty: ProblemDifficulty.Easy,
    tags: [],
    input: [],
    expectedOutput: [],
    hints: [],
    drivers: []
  });

  const [drivers, setDrivers] = useState<CreateProblemDriverRequest[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [tagInput, setTagInput] = useState('');
  const [hintInput, setHintInput] = useState('');
  const [problemInput, setProblemInput] = useState('');
  const [problemExpectedOutput, setProblemExpectedOutput] = useState('');
  const [selectedLanguageToAdd, setSelectedLanguageToAdd] = useState<Language | null>(null);

  // Validation state
  const [isValidated, setIsValidated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<CreateProblemValidationResponse | null>(null);
  const [validationError, setValidationError] = useState<Error | null>(null);
  const [createError, setCreateError] = useState<Error | null>(null);

  // Reset validation when form changes
  useEffect(() => {
    setIsValidated(false);
    setValidationErrors([]);
    setValidationResult(null);
    setValidationError(null);
    setCreateError(null);
  }, [problem, drivers]);

  const addLanguageDriver = () => {
    if (!selectedLanguageToAdd || driverTemplates.length === 0) return;

    // Check if language is already added
    const usedLanguages = drivers.map(d => d.language);
    if (usedLanguages.includes(selectedLanguageToAdd)) return;

    // Find the template for the selected language
    const languageTemplate = driverTemplates.find(t => t.language === selectedLanguageToAdd);

    if (languageTemplate) {
      const newDriver: CreateProblemDriverRequest = {
        language: languageTemplate.language,
        image: `code-executor-${languageTemplate.language.toLowerCase()}`,
        driverCode: languageTemplate.template,
        uiTemplate: languageTemplate.uiTemplate,
        answer: languageTemplate.uiTemplate
      };

      setDrivers(prev => [...prev, newDriver]);
      setActiveTab(newDriver.language);
      setSelectedLanguageToAdd(null); // Reset selection
    }
  };

  const removeDriver = (language: Language) => {
    setDrivers(prev => prev.filter(d => d.language !== language));
    if (activeTab === language) {
      setActiveTab('basic');
    }
  };

  const updateDriver = (language: Language, updates: Partial<CreateProblemDriverRequest>) => {
    setDrivers(prev => prev.map(d => (d.language === language ? { ...d, ...updates } : d)));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !problem.tags?.map(x => x.name).includes(tagInput.trim())) {
      setProblem(prev => ({
        ...prev,
        tags: [...(prev.tags || []), { name: tagInput.trim() }]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setProblem(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag.name !== tagToRemove) || []
    }));
  };

  const handleAddHint = () => {
    if (hintInput.trim() && !problem.hints?.includes(hintInput.trim())) {
      setProblem(prev => ({
        ...prev,
        hints: [...(prev.hints || []), hintInput.trim()]
      }));
      setHintInput('');
    }
  };

  const handleRemoveHint = (hintToRemove: string) => {
    setProblem(prev => ({
      ...prev,
      hints: prev.hints?.filter(hint => hint !== hintToRemove) || []
    }));
  };

  const handleValidate = async () => {
    try {
      setValidationError(null);

      // Create drivers from all language drivers
      const problemDrivers: CreateProblemDriverRequest[] = drivers.map(driver => ({
        language: driver.language,
        image: `code-executor-${driver.language.toLowerCase()}`,
        driverCode: driver.driverCode,
        uiTemplate: driver.uiTemplate,
        answer: driver.answer
      }));

      const newProblem: CreateProblemRequest = {
        ...(problem as CreateProblemRequest),
        drivers: problemDrivers
      };

      const validationResponse = await validateProblem.mutateAsync(newProblem);
      setValidationResult(validationResponse);

      if (validationResponse.isValid) {
        setIsValidated(true);
        setValidationErrors([]);
      } else {
        setIsValidated(false);
        const errors = [
          validationResponse.errorMessage,
          ...validationResponse.driverValidations
            .filter(dv => !dv.isValid)
            .map(dv => `${dv.language}: ${dv.errorMessage}`)
        ].filter(Boolean) as string[];
        setValidationErrors(errors);
      }
    } catch (err) {
      console.error('Failed to validate problem:', err);
      setValidationError(err as Error);
      setIsValidated(false);
      setValidationErrors([]);
    }
  };

  const handleSubmit = async () => {
    try {
      setCreateError(null);

      // Create drivers from all language drivers
      const problemDrivers: CreateProblemDriverRequest[] = drivers.map(driver => ({
        language: driver.language,
        image: `code-executor-${driver.language.toLowerCase()}`,
        driverCode: driver.driverCode,
        uiTemplate: driver.uiTemplate,
        answer: driver.answer
      }));

      const newProblem: CreateProblemRequest = {
        ...(problem as CreateProblemRequest),
        drivers: problemDrivers
      };

      const createdProblem = await createProblem.mutateAsync(newProblem);
      navigate(`/problems/${createdProblem.id}`);
    } catch (err) {
      console.error('Failed to create problem:', err);
      setCreateError(err as Error);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ApiErrorDisplay
          error={error}
          title="Failed to load driver templates"
          className="max-w-md"
          showDetails={true}
        />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate('/')}
          startContent={<ArrowLeftIcon className="w-5 h-5" />}
        />
        <h2 className="text-3xl font-bold text-white">Create New Problem</h2>
      </div>

      <div className="space-y-6">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={key => setActiveTab(key as string)}
          aria-label="Problem creation tabs"
          color="primary"
          variant="underlined"
          classNames={{
            tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
            cursor: 'w-full bg-primary',
            tab: 'max-w-fit px-0 h-12',
            tabContent: 'group-data-[selected=true]:text-primary'
          }}
        >
          <Tab key="basic" title="Basic Info">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Problem Details</h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <Input
                      label="Name"
                      placeholder="Problem name"
                      value={problem.name}
                      onChange={e => setProblem(prev => ({ ...prev, name: e.target.value }))}
                      variant="bordered"
                      color="primary"
                    />

                    <Textarea
                      label="Description"
                      placeholder="Problem description"
                      value={problem.description}
                      onChange={e => setProblem(prev => ({ ...prev, description: e.target.value }))}
                      variant="bordered"
                      color="primary"
                      minRows={4}
                    />

                    <Select
                      label="Difficulty"
                      selectedKeys={[problem.difficulty || ProblemDifficulty.Easy]}
                      onSelectionChange={keys => {
                        const difficulty = Array.from(keys)[0] as ProblemDifficulty;
                        setProblem(prev => ({ ...prev, difficulty }));
                      }}
                      variant="bordered"
                      color="primary"
                    >
                      <SelectItem key={ProblemDifficulty.VeryEasy}>Very Easy</SelectItem>
                      <SelectItem key={ProblemDifficulty.Easy}>Easy</SelectItem>
                      <SelectItem key={ProblemDifficulty.Medium}>Medium</SelectItem>
                      <SelectItem key={ProblemDifficulty.Hard}>Hard</SelectItem>
                      <SelectItem key={ProblemDifficulty.VeryHard}>Very Hard</SelectItem>
                    </Select>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tag and press Enter"
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                          variant="bordered"
                          color="primary"
                          className="flex-1"
                        />
                        <Button color="primary" onPress={handleAddTag}>
                          Add Tag
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {problem.tags?.map(tag => (
                          <Chip key={tag.name} onClose={() => handleRemoveTag(tag.name)} variant="flat" color="primary">
                            {tag.name}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add hint and press Enter"
                          value={hintInput}
                          onChange={e => setHintInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddHint()}
                          variant="bordered"
                          color="secondary"
                          className="flex-1"
                        />
                        <Button color="secondary" onPress={handleAddHint}>
                          Add Hint
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {problem.hints?.map((hint, index) => (
                          <Chip key={index} onClose={() => handleRemoveHint(hint)} variant="flat" color="secondary">
                            {hint}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Test Data</h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <Textarea
                      label="Input Array (JSON)"
                      placeholder="[1, 2, 3]"
                      value={problemInput}
                      onChange={e => {
                        try {
                          setProblemInput(e.target.value);
                          const parsed = JSON.parse(e.target.value);
                          setProblem(prev => ({ ...prev, input: parsed }));
                        } catch {
                          // swallow invalid JSON error
                        }
                      }}
                      variant="bordered"
                      color="primary"
                      minRows={4}
                    />

                    <Textarea
                      label="Expected Output Array (JSON)"
                      placeholder="[3, 5, 7]"
                      value={problemExpectedOutput}
                      onChange={e => {
                        try {
                          setProblemExpectedOutput(e.target.value);
                          const parsed = JSON.parse(e.target.value);
                          setProblem(prev => ({ ...prev, expectedOutput: parsed }));
                        } catch {
                          // swallow invalid JSON error
                        }
                      }}
                      variant="bordered"
                      color="primary"
                      minRows={4}
                    />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="text-xl font-semibold">Language Drivers</h3>
                    <div className="flex items-center gap-2">
                      <Select
                        label="Add Driver"
                        aria-label="Select language driver"
                        placeholder="Select language"
                        selectedKeys={selectedLanguageToAdd ? [selectedLanguageToAdd] : []}
                        onSelectionChange={keys => {
                          const language = Array.from(keys)[0] as Language;
                          setSelectedLanguageToAdd(language);
                        }}
                        variant="bordered"
                        color="primary"
                        size="sm"
                        className="min-w-32"
                      >
                        {driverTemplates
                          .filter(template => !drivers.map(d => d.language).includes(template.language))
                          .map(template => (
                            <SelectItem key={template.language}>{template.language}</SelectItem>
                          ))}
                      </Select>
                      <Button
                        color="primary"
                        variant="flat"
                        size="sm"
                        onPress={addLanguageDriver}
                        startContent={<PlusIcon className="w-4 h-4" />}
                        isDisabled={!selectedLanguageToAdd || drivers.length >= driverTemplates.length}
                      >
                        Add Driver
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-2">
                      {drivers.length === 0 ? (
                        <p className="text-default-500 text-sm">
                          No language drivers added yet. Click "Add Driver" to get started.
                        </p>
                      ) : (
                        drivers.map(driver => (
                          <div
                            key={driver.language}
                            className="flex items-center justify-between p-3 border border-divider rounded-lg"
                          >
                            <span className="font-medium">{driver.language}</span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => removeDriver(driver.language)}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </Tab>

          {drivers.map(driver => (
            <Tab key={driver.language} title={driver.language}>
              <div className="space-y-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{driver.language} Driver</h2>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    onPress={() => removeDriver(driver.language)}
                    startContent={<XMarkIcon className="w-4 h-4" />}
                  >
                    Remove Driver
                  </Button>
                </div>
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">UI Template - {driver.language}</h3>
                  </CardHeader>
                  <CardBody className="p-2">
                    <CodeEditor
                      language={driver.language}
                      code={driver.uiTemplate}
                      onChange={value => updateDriver(driver.language, { uiTemplate: value ?? '' })}
                      uiTemplate=""
                    />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Driver Code - {driver.language}</h3>
                  </CardHeader>
                  <CardBody className="p-2">
                    <CodeEditor
                      language={driver.language}
                      code={driver.driverCode}
                      onChange={value => updateDriver(driver.language, { driverCode: value ?? '' })}
                      uiTemplate=""
                    />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Default Solution - {driver.language}</h3>
                  </CardHeader>
                  <CardBody className="p-2">
                    <CodeEditor
                      language={driver.language}
                      code={driver.answer}
                      onChange={value => updateDriver(driver.language, { answer: value ?? '' })}
                      uiTemplate=""
                    />
                  </CardBody>
                </Card>
              </div>
            </Tab>
          ))}
        </Tabs>
      </div>

      {/* API Error Display for Validation */}
      {validationError && (
        <ApiErrorDisplay error={validationError} title="Validation Request Failed" showDetails={true} />
      )}

      {/* API Error Display for Creation */}
      {createError && <ApiErrorDisplay error={createError} title="Problem Creation Failed" showDetails={true} />}

      {/* Validation Error Display */}
      {validationErrors.length > 0 && (
        <Card className="border-danger">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-danger">Validation Errors</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Validation Success Display */}
      {isValidated && validationResult?.isValid && (
        <Card className="border-success">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-success">✅ Validation Successful</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-success text-sm">
              All driver templates validated successfully. You can now create the problem.
            </p>
            {validationResult?.driverValidations?.map((dv: any, index: number) => (
              <div key={index} className="mt-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-success text-sm">
                  <strong>{dv.language}:</strong> {dv.submissionResult.passedTestCases}/
                  {dv.submissionResult.testCaseCount} test cases passed
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          color="secondary"
          size="lg"
          onPress={handleValidate}
          isDisabled={
            !problem.name ||
            !problem.description ||
            drivers.length === 0 ||
            drivers.some(d => !d.driverCode || !d.answer)
          }
          isLoading={validateProblem.isPending}
          variant="bordered"
        >
          {validateProblem.isPending ? 'Validating...' : 'Validate'}
        </Button>

        <Button
          color="primary"
          size="lg"
          onPress={handleSubmit}
          isDisabled={
            !problem.name ||
            !problem.description ||
            drivers.length === 0 ||
            drivers.some(d => !d.driverCode || !d.answer) ||
            !isValidated
          }
          isLoading={createProblem.isPending}
        >
          {createProblem.isPending ? 'Creating...' : 'Create Problem'}
        </Button>
      </div>
    </div>
  );
};
