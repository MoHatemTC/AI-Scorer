from pydantic import BaseModel, Field
from typing import List
from typing import List, Union

class RequirementsConfig(BaseModel):
    requirements_list: List[str] = Field(
        ...,
        description="Requirements List",
        min_items=0,
        max_items=15
    ) 


class QualityScoringConfig(BaseModel):
    quality_score: Union[int, str] = Field(..., description="Quality Score")
    quality_comment: str = Field(..., description="Quality Comment")


class ScopeConfig(BaseModel):
    deliverables_list: List[str] = Field(
        ...,
        description="Deliverables List",
        min_items=0,
        max_items=15
    ) 


class ScopeScoringConfig(BaseModel):
    scope_score: Union[int, str] = Field(..., description="Scope Score")
    scope_comment: str = Field(..., description="Scope Comment")
